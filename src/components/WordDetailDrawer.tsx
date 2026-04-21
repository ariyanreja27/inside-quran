import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Volume2, Pause, Ruler, Boxes, ExternalLink, Copy, Check, Share2, ChevronRight, Layers, BookOpen
} from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Word } from '@/types/quran';
import { useSettings } from '@/hooks/useAppStore';
import { GrammarGlossary } from './GrammarGlossary';
import { MOOD_LABELS, CASE_LABELS, getPoSColor } from '@/utils/grammar-utils';

// ─── Morphology Parsing ──────────────────────────────────────────────────────
let morphologyCache: string[] | null = null;
const MORPHOLOGY_URL = '/data/quran-morphology.txt';

async function loadMorphologyLines(): Promise<string[]> {
  if (morphologyCache) return morphologyCache;
  const res = await fetch(MORPHOLOGY_URL);
  if (!res.ok) throw new Error('Failed to load morphology data');
  const text = await res.text();
  morphologyCache = text.split('\n').filter(Boolean);
  return morphologyCache;
}

// ─── Glossary ────────────────────────────────────────────────────────────────
interface GlossaryTerm {
  label: string;
  desc: string;
}

interface GlossaryData {
  groups: { id: string; name: string; tags: string[] }[];
  terms: Record<string, GlossaryTerm>;
}

let glossaryCache: GlossaryData | null = null;
const GLOSSARY_URL = '/data/morphology-glossary.json';

async function loadGlossary(): Promise<GlossaryData> {
  if (glossaryCache) return glossaryCache;
  const res = await fetch(GLOSSARY_URL);
  if (!res.ok) throw new Error('Failed to load glossary');
  glossaryCache = await res.json();
  return glossaryCache!;
}

// MOOD_LABELS and CASE_LABELS moved to @/utils/grammar-utils

interface Morpheme {
  text: string;
  root?: string;
  lemma?: string;
  pos?: string;
  isPrefix: boolean;
  isSuffix: boolean;
  isDeterminer: boolean;
  isIndefinite: boolean;
  features: string[];
}

interface WordStats {
  morphemes: Morpheme[];
  root?: string;
  lemma?: string;
  pos?: string;
  structure: string;
  features: string[];
}

function detectStructure(morphemes: Morpheme[], stem: Morpheme | null): string {
  const allPos = morphemes.map(m => m.pos);
  const allFeatures = morphemes.flatMap(m => m.features);

  // 1. High Priority Particles
  if (allPos.includes('VOC')) return 'Nidā’ (Vocative Structure)';
  if (allPos.includes('INTG')) return 'Istifhām (Interrogative Structure)';
  if (allPos.includes('NEG')) return 'Nafy (Negation Structure)';
  if (allPos.includes('PRO')) return 'Nahy (Prohibition Structure)';
  if (allPos.includes('COND')) return 'Jumlah Shartiyyah (Conditional Sentence)';
  if (allPos.includes('REL')) return 'Ṣilah (Relative Clause)';
  if (allPos.includes('RES')) return 'Ḥaṣr (Restriction Structure)';
  if (allPos.includes('ACC')) return 'Inna wa Akhawātuhā (Emphasis)';
  
  // 2. Clause Indicators
  if (allPos.includes('RSLT')) return 'Jawāb al-Sharṭ (Conditional Response)';
  if (allPos.includes('ANS')) return 'Jawāb (Result Clause)';
  if (allPos.includes('CAUS')) return 'Ta‘līl (Purpose Clause)';
  if (allPos.includes('SUR')) return 'Mufāja’ah (Surprise Structure)';
  if (allPos.includes('REM')) return 'Isti’nāf (Continuation Structure)';
  
  // 3. Emphasis (Tawkīd)
  if (allFeatures.some(f => f && f.includes('EMP')) || allPos.includes('AVR')) return 'Tawkīd (Emphasis)';

  // 4. Construct / Possessive
  const hasPronSuff = morphemes.some(m => m.isSuffix && m.pos === 'PRON');
  const isConstructCandidate = stem && ['N', 'ADJ', 'ACT_PCPL', 'PASS_PCPL'].includes(stem.pos || '');
  if (hasPronSuff || isConstructCandidate) return 'Idāfah (Construct)';

  // 5. Verbal vs Nominal
  if (stem) {
    if (['V', 'IMPF', 'PERF', 'IMPV'].includes(stem.pos || '')) {
      if (allFeatures.includes('PASS')) return 'Passive Construction';
      if (allFeatures.includes('ACT')) return 'Active Construction';
      return 'Jumlah Fi‘liyyah (Verbal Sentence)';
    }
    if (stem.pos === 'ADJ') return 'Na‘t (Adjective Structure)';
    if (stem.pos === 'N' || stem.pos === 'PN' || stem.pos === 'PRON') {
      return 'Jumlah Ismiyyah (Nominal Sentence)';
    }
    if (stem.pos === 'T') return 'Zarf Zamān (Temporal Clause)';
    if (stem.pos === 'LOC') return 'Zarf Makān (Spatial Clause)';
  }

  return 'Normal';
}

function parseLine(line: string, glossary: GlossaryData): Morpheme | null {
  const cols = line.split('\t');
  if (cols.length < 4) return null;
  const arabic = cols[1];
  const category = cols[2]; // Part of Speech Category (N, V, P, etc.)
  const tag = cols[3]; // Detailed Tags
  const parts = tag.split('|');
  const m: Morpheme = { 
    text: arabic,
    features: [], 
    isPrefix: tag.includes('|PREF'), 
    isSuffix: tag.includes('|SUFF'),
    isDeterminer: tag.includes('|DET') || tag.startsWith('DET|'),
    isIndefinite: tag.includes('|IND') || tag.includes('|INDEF'),
    pos: category // Initialize with the category column
  };

  for (const p of parts) {
    if (p.startsWith('ROOT:')) m.root = p.slice(5);
    else if (p.startsWith('LEM:')) m.lemma = p.slice(4);
    else if (glossary.terms[p] && p !== 'NOM' && p !== 'ACC' && p !== 'GEN') m.pos = p; // Tags can override category with more specific PoS
    else if (p === 'NOM' || p === 'ACC' || p === 'GEN' || p.includes(':')) m.features.push(p);
    else if (p !== 'PREF' && p !== 'SUFF' && p !== 'DET' && p !== 'IND' && p !== 'INDEF') {
      m.features.push(p);
    }
  }
  return m;
}

async function analyzeWord(location: string): Promise<WordStats> {
  const [lines, glossary] = await Promise.all([loadMorphologyLines(), loadGlossary()]);
  const [surah, verse, wordPos] = location.split(':');
  const wordPrefix = `${surah}:${verse}:${wordPos}:`;
  const wordLines = lines.filter(l => l.startsWith(wordPrefix));
  const morphemes = wordLines.map(l => parseLine(l, glossary)).filter(Boolean) as Morpheme[];
  
  // Stem is the first morpheme that is not a prefix and not a suffix, or just the first one
  const stem = morphemes.find(m => !m.isPrefix && !m.isSuffix) || morphemes[0];
  
  const structure = detectStructure(morphemes, stem);

  return {
    morphemes,
    root: stem?.root || morphemes.find(m => m.root)?.root,
    lemma: stem?.lemma || morphemes.find(m => m.lemma)?.lemma,
    pos: stem?.pos,
    structure,
    features: morphemes.flatMap(m => m.features),
  };
}

// POS_COLORS and getPoSColor moved to @/utils/grammar-utils

export function WordDetailDrawer({ word, onClose }: { word: Word | null; onClose: () => void }) {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [stats, setStats] = useState<WordStats | null>(null);
  const [glossary, setGlossary] = useState<GlossaryData | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reflection'>('overview');

  useEffect(() => {
    loadGlossary().then(setGlossary);
  }, []);

  useEffect(() => {
    if (!word) {
      setStats(null);
      return;
    }
    
    if (word.location) {
      analyzeWord(word.location).then(newStats => {
        setStats(newStats);
        const stemIdx = newStats.morphemes.findIndex(m => !m.isPrefix && !m.isSuffix);
        setActiveIdx(stemIdx !== -1 ? stemIdx : 0);
      });
    }
  }, [word]);

  const copyWord = () => {
    if (!word) return;
    navigator.clipboard.writeText(word.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const currentMorpheme = (stats && activeIdx !== null && stats.morphemes[activeIdx]) ? stats.morphemes[activeIdx] : null;
  const posToShow = currentMorpheme?.pos || stats?.pos;

  const isVerb = posToShow && ['V', 'IMPF', 'PERF', 'IMPV'].includes(posToShow);
  const activeFeatures = currentMorpheme?.features || stats?.features || [];
  
  const moodLabel = activeFeatures.find(f => MOOD_LABELS[f]) ? MOOD_LABELS[activeFeatures.find(f => MOOD_LABELS[f])!] : null;
  const caseData = activeFeatures.find(f => CASE_LABELS[f]) ? CASE_LABELS[activeFeatures.find(f => CASE_LABELS[f])!] : null;

  return (
    <Drawer open={!!word} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="rounded-t-[3rem] bg-[#FBF7F4] border-none focus:outline-none max-h-[92vh] flex flex-col outline-none ring-0">
        
        {word && (
          <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
            <DrawerTitle className="sr-only">Word Detail</DrawerTitle>
            <DrawerDescription className="sr-only">Linguistic analysis for {word.transliteration}</DrawerDescription>

            {/* ── Hero Section ── */}
            <div className="flex items-start gap-4 mb-10 pt-8">
              <div dir="rtl" className="whitespace-nowrap">
                {stats?.morphemes.map((m, i) => (
                  <span 
                    key={i} 
                    className="arabic-text text-[48px] leading-none" 
                    style={{ color: getPoSColor(m.pos) }}
                  >
                    {m.text}
                  </span>
                ))}
                {(!stats || stats.morphemes.length === 0) && (
                  <span className="arabic-text text-[48px] text-foreground leading-none">{word.text}</span>
                )}
              </div>
              <div className="pt-2 flex-1">
                <p className="font-serif italic text-[18px] text-primary font-medium tracking-tight leading-none lowercase capitalize">
                  {word.transliteration || '...'}
                </p>
                <p className="font-body text-[11px] font-normal text-muted-foreground pt-1.5 opacity-80">
                  {word.translation || '...'}
                </p>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="flex items-center gap-2 mb-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-foreground/[0.02] text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground'
                }`}
              >
                <Layers size={16} strokeWidth={2.5} />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('reflection')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'reflection'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-foreground/[0.02] text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground'
                }`}
              >
                <BookOpen size={16} strokeWidth={2.5} />
                Reflection
              </button>
            </div>

            {activeTab === 'overview' ? (
              <>
            {/* ── Grammar Breakdown ── */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/5">
                  <Ruler size={16} strokeWidth={1.5} />
                </div>
                <h3 className="font-display font-semibold italic text-[17px] text-foreground">Grammar Breakdown</h3>
              </div>

              <div className="space-y-4 px-1">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <span className="text-[13px] text-muted-foreground font-medium">Part of Speech</span>
                     <GrammarGlossary />
                   </div>
                    <div className="flex items-center gap-2.5">
                       {stats?.morphemes.map((m, i) => (
                         <button
                           key={i}
                           onClick={() => setActiveIdx(activeIdx === i ? null : i)}
                           className="transition-all duration-300 focus:outline-none"
                         >
                           {activeIdx === i ? (
                             <div 
                               className="px-3 py-1 text-white text-[10px] font-bold rounded-full tracking-widest uppercase flex items-center justify-center min-w-[40px] shadow-sm animate-in fade-in zoom-in duration-300"
                               style={{ backgroundColor: getPoSColor(m.pos) }}
                             >
                               {m.pos ? (glossary?.terms[m.pos]?.label || m.pos) : 'N/A'}
                             </div>
                           ) : (
                             <div 
                               className="w-3 h-3 rounded-full hover:scale-125 transition-transform bg-muted-foreground/20 ring-1 ring-black/5" 
                               style={{ backgroundColor: getPoSColor(m.pos) }}
                             />
                           )}
                         </button>
                       ))}
                       {(!stats || stats.morphemes.length === 0) && (
                         <div className="px-3 py-1 bg-primary text-primary-foreground text-[9px] font-bold rounded-full tracking-widest uppercase flex items-center justify-center min-w-[36px]">
                           {stats?.pos ? (glossary?.terms[stats.pos]?.label || stats.pos) : 'N/A'}
                         </div>
                       )}
                    </div>
                </div>
                <div className="h-px bg-border/30" />
                
                <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground font-medium">{isVerb ? 'Mood' : 'Case'}</span>
                    <span className="text-[14px] font-display italic font-medium text-foreground">
                       {isVerb 
                         ? (moodLabel || (stats ? 'N/A' : '...')) 
                         : (caseData ? `${caseData.label} (${caseData.arabic})` : (stats ? 'N/A' : '...'))}
                    </span>
                 </div>
                 <div className="h-px bg-border/30" />
 
                  <div className="flex items-center justify-between">
                     <span className="text-[13px] text-muted-foreground font-medium">Structure</span>
                     <span className="text-[14px] font-display italic font-medium text-foreground">
                        {stats ? (stats.structure || 'N/A') : '...'}
                     </span>
                  </div>
              </div>
            </div>

            {/* ── Morphology ── */}
            <div className="space-y-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/5">
                  <Boxes size={16} strokeWidth={1.5} />
                </div>
                <h3 className="font-display font-semibold italic text-[17px] text-foreground">Morphology</h3>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="space-y-3">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">ROOT LETTERS</p>
                  <div className="flex gap-2" dir="rtl">
                    {(currentMorpheme?.root || stats?.root) ? (currentMorpheme?.root || stats?.root)!.split('').map((char, i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-white border border-border/40 shadow-sm flex items-center justify-center">
                        <span className="arabic-text text-[20px] pt-1">{char}</span>
                      </div>
                    )) : (
                      <div className="text-[11px] text-muted-foreground italic min-h-[40px] flex items-center">No root</div>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-3">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">LEMMA</p>
                  {(currentMorpheme?.lemma || stats?.lemma) ? (
                    <div className="flex flex-col items-end justify-center h-10">
                      <span className="arabic-text text-[22px] text-foreground leading-none">{currentMorpheme?.lemma || stats?.lemma}</span>
                    </div>
                  ) : <span className="text-[11px] text-muted-foreground italic min-h-[40px] flex items-center">N/A</span>}
                </div>
              </div>
            </div>
              </>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-70 mb-6 border-[1.5px] border-dashed border-border/80 rounded-[2rem] bg-card/30">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex flex-col items-center justify-center mb-3">
                  <BookOpen size={20} className="text-muted-foreground" strokeWidth={2} />
                </div>
                <p className="text-[14px] font-semibold text-foreground">Reflection Area</p>
                <p className="text-[12px] text-muted-foreground mt-1 px-8 leading-relaxed">Personal reflections and linguistic notes for this word will appear here.</p>
              </div>
            )}

            {/* ── More Details & Close ── */}
            <div className="space-y-3 pt-2">
              <button 
                onClick={() => {
                  onClose();
                  navigate(`/word-details?location=${word.location}`);
                }} 
                className="w-full flex items-center justify-center gap-2 text-primary/70 font-medium py-2 rounded-2xl transition-colors text-[13px] italic hover:text-primary"
              >
                Click for more details <ExternalLink size={13} />
              </button>

              <button 
                onClick={onClose}
                className="w-full bg-primary/[0.04] hover:bg-primary/[0.08] text-primary font-semibold py-3.5 rounded-full transition-colors text-[15px] border border-primary/[0.05]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
