import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Volume2, Pause, BookOpen, ChevronDown, ChevronUp, Loader2,
  Copy, Check, ExternalLink, Hash, Layers, AlignLeft, Globe
} from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Word } from '@/types/quran';
import DOMPurify from 'dompurify';
import { surahList } from '@/data/quranMeta';
import { useSettings } from '@/hooks/useAppStore';

const AVAILABLE_TAFSIRS: Record<string, { id: string, name: string, apiId: number | string }[]> = {
  en: [
    { id: 'en-ibn-kathir', name: 'Tafsir Ibn Kathir (Abridged)', apiId: 169 },
    { id: 'en-maarif-ul-quran', name: "Ma'arif al-Qur'an", apiId: 168 },
    { id: 'en-al-jalalayn', name: 'Al-Jalalayn', apiId: 'en-al-jalalayn' }
  ],
  bn: [
    { id: 'bn-ibn-kathir', name: 'Tafseer Ibn Kathir', apiId: 164 },
    { id: 'bn-abu-bakr-zakaria', name: 'Tafsir Abu Bakr Zakaria', apiId: 166 },
    { id: 'bn-ahsanul-bayaan', name: 'Tafsir Ahsanul Bayaan', apiId: 165 },
    { id: 'bn-fathul-majid', name: 'Tafsir Fathul Majid', apiId: 381 }
  ],
  ur: [
    { id: 'ur-ibn-kathir', name: 'Tafsir Ibn Kathir', apiId: 160 }
  ]
};

// ─── Morphology dataset (Quranic Arabic Corpus) ──────────────────────────────
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

// ─── Labels ──────────────────────────────────────────────────────────────────
const POS_LABELS: Record<string, string> = {
  N: 'Noun', V: 'Verb', P: 'Particle', ADJ: 'Adjective',
  IMPF: 'Imperfect Verb', PERF: 'Perfect Verb', IMPV: 'Imperative Verb',
  ACT_PCPL: 'Active Participle', PASS_PCPL: 'Passive Participle',
  PN: 'Proper Noun', REL: 'Relative Pronoun', DEM: 'Demonstrative Pronoun',
  PRON: 'Pronoun', CONJ: 'Conjunction', NEG: 'Negation particle',
  INL: 'Disjointed Letters (Huruf Muqatta\'at)',
  RSLT: 'Result particle', COND: 'Conditional particle',
  T: 'Time', LOC: 'Location', ANS: 'Answer particle', IMPERS: 'Impersonal verb',
  SUP: 'Supportive', COM: 'Comitative', CIRC: 'Circumstantial',
  EXL: 'Exclamation', EMP: 'Emphatic', NOM: 'Nominative', ACC: 'Accusative',
  GEN: 'Genitive',
};

const FEATURE_LABELS: Record<string, string> = {
  M: 'Masculine', F: 'Feminine',
  MS: 'Masculine Singular', FS: 'Feminine Singular',
  MD: 'Masculine Dual', FD: 'Feminine Dual',
  MP: 'Masculine Plural', FP: 'Feminine Plural',
  NOM: 'Nominative', ACC: 'Accusative', GEN: 'Genitive',
  INDEF: 'Indefinite', DEF: 'Definite',
  '1P': '1st Person Plural', '1S': '1st Person Singular',
  '2MS': '2nd Person Masc. Sg.', '2FS': '2nd Person Fem. Sg.',
  '2MD': '2nd Person Masc. Dual', '2MP': '2nd Person Masc. Pl.',
  '3MS': '3rd Person Masc. Sg.', '3FS': '3rd Person Fem. Sg.',
  '3MD': '3rd Person Masc. Dual', '3MP': '3rd Person Masc. Pl.',
  PASS: 'Passive voice', ACT: 'Active voice',
  'MOOD:IND': 'Indicative mood', 'MOOD:SUBJ': 'Subjunctive mood',
  'MOOD:JUS': 'Jussive mood',
  'VF:1': 'Form I (فَعَلَ)', 'VF:2': 'Form II (فَعَّلَ)',
  'VF:3': 'Form III (فَاعَلَ)', 'VF:4': 'Form IV (أَفْعَلَ)',
  'VF:5': 'Form V (تَفَعَّلَ)', 'VF:6': 'Form VI (تَفَاعَلَ)',
  'VF:7': 'Form VII (اِنْفَعَلَ)', 'VF:8': 'Form VIII (اِفْتَعَلَ)',
  'VF:10': 'Form X (اِسْتَفْعَلَ)',
};

// ─── Grammar case explainers ──────────────────────────────────────────────────
const CASE_EXPLAIN: Record<string, string> = {
  NOM: 'Nominative (مَرْفُوع) — the subject of the sentence. Indicated by ḍammah (ُ) or its substitutes.',
  ACC: 'Accusative (مَنْصُوب) — the object of a verb or preposition. Indicated by fatḥah (َ) or its substitutes.',
  GEN: 'Genitive (مَجْرُور) — following a preposition, or the second term of an iḍāfah (possessive). Indicated by kasrah (ِ) or its substitutes.',
};

// ─── Data interfaces ──────────────────────────────────────────────────────────
interface Morpheme {
  root?: string;
  lemma?: string;
  pos?: string;
  features: string[];
  isAffix: boolean;
  verbForm?: string;
}

interface WordStats {
  morphemes: Morpheme[];
  root?: string;
  lemma?: string;
  pos?: string;
  features: string[];
  verbForm?: string;
  allAffixes: Morpheme[];
  rootFrequency: number;
  uniqueVersesCount: number;
  allVersesWithRoot: string[];
  allRelatedLemmas: { lemma: string; count: number }[];
}

function parseLine(line: string): Morpheme | null {
  const cols = line.split('\t');
  if (cols.length < 4) return null;
  const tag = cols[3];
  const parts = tag.split('|');
  const m: Morpheme = { features: [], isAffix: false };
  m.isAffix = parts.includes('PREF') || parts.includes('SUFF');
  for (const p of parts) {
    if (p.startsWith('ROOT:')) m.root = p.slice(5);
    else if (p.startsWith('LEM:')) m.lemma = p.slice(4);
    else if (p.startsWith('VF:')) { m.verbForm = p; m.features.push(p); }
    else if (!m.pos && POS_LABELS[p] && p !== 'NOM' && p !== 'ACC' && p !== 'GEN') m.pos = p;
    else if (FEATURE_LABELS[p]) m.features.push(p);
  }
  return m;
}

async function analyzeWord(location: string): Promise<WordStats> {
  const lines = await loadMorphologyLines();
  const [surah, verse, wordPos] = location.split(':');
  const wordPrefix = `${surah}:${verse}:${wordPos}:`;

  // This word's morphemes
  const wordLines = lines.filter(l => l.startsWith(wordPrefix));
  const morphemes = wordLines.map(parseLine).filter(Boolean) as Morpheme[];

  const main = morphemes.find(m => !m.isAffix);
  const allAffixes = morphemes.filter(m => m.isAffix);
  const root = main?.root;
  const lemma = main?.lemma;
  const pos = main?.pos;
  const features = main?.features || [];
  const verbForm = main?.verbForm;

  // Root-wide analysis
  let rootFrequency = 0;
  const lemmaCountMap: Record<string, number> = {};
  const versesWithRootSet = new Set<string>();

  if (root) {
    const rootTag = `ROOT:${root}`;
    for (const line of lines) {
      if (!line.includes(rootTag)) continue;
      rootFrequency++;
      const cols = line.split('\t');
      if (cols[0]) {
        const p = cols[0].split(':');
        versesWithRootSet.add(`${p[0]}:${p[1]}`);
        const lemmaMatch = cols[3]?.match(/LEM:([^|]+)/);
        if (lemmaMatch) {
          const l = lemmaMatch[1];
          lemmaCountMap[l] = (lemmaCountMap[l] || 0) + 1;
        }
      }
    }
  }

  const allVersesWithRoot = Array.from(versesWithRootSet);

  const allRelatedLemmas = Object.entries(lemmaCountMap)
    .map(([l, count]) => ({ lemma: l, count }))
    .sort((a, b) => b.count - a.count)
    .filter(({ lemma: l }) => l !== lemma); // exclude current word's own lemma

  return {
    morphemes, root, lemma, pos, features, verbForm, allAffixes,
    rootFrequency,
    uniqueVersesCount: versesWithRootSet.size,
    allVersesWithRoot,
    allRelatedLemmas,
  };
}

// ─── Tafsir — render full HTML ────────────────────────────────────────────────
async function fetchFullTafsir(verseKey: string, tafsirId: string, apiId: number | string): Promise<string | null> {
  try {
    const surahNumber = parseInt(verseKey.split(':')[0]);
    const ayahNumber = parseInt(verseKey.split(':')[1]);
    const meta = surahList.find(s => s.number === surahNumber);
    if (!meta) return null;
    
    const slugName = meta.name.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const slug = `${String(surahNumber).padStart(3, '0')}-${slugName}.json`;
    
    // Fetching from pre-downloaded local offline backup
    const localRes = await fetch(`/data/tafsirs/${tafsirId}/${slug}`);
    if (localRes.ok) {
        const localData = await localRes.json();
        const verseTafsir = localData.verses.find((v: any) => v.verse_key === verseKey || v.verse_number === ayahNumber);
        if (verseTafsir) return (verseTafsir.text as string);
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
interface WordDetailDrawerProps {
  word: Word | null;
  onClose: () => void;
}

type Tab = 'overview' | 'grammar' | 'tafsir';
const TABS: { id: Tab; label: string; icon: typeof Layers }[] = [
  { id: 'overview', label: 'Overview', icon: Layers },
  { id: 'grammar', label: 'Grammar', icon: BookOpen },
  { id: 'tafsir', label: 'Tafsir', icon: AlignLeft },
];

export function WordDetailDrawer({ word, onClose }: WordDetailDrawerProps) {
  const { settings } = useSettings();
  const validLang = AVAILABLE_TAFSIRS[settings.language] && AVAILABLE_TAFSIRS[settings.language].length > 0 ? settings.language : 'en';
  const availableEditions = AVAILABLE_TAFSIRS[validLang];

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<WordStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [tafsirHtml, setTafsirHtml] = useState<string | null>(null);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [activeTafsirId, setActiveTafsirId] = useState(availableEditions[0].id);
  const [copied, setCopied] = useState(false);
  const [versesExpanded, setVersesExpanded] = useState(false);
  const [relatedExpanded, setRelatedExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isRealWord = !!word?.transliteration;

  useEffect(() => {
    setStats(null); setTafsirHtml(null); setIsPlaying(false);
    setActiveTab('overview'); setVersesExpanded(false); setRelatedExpanded(false);
    setActiveTafsirId(availableEditions[0].id);

    if (!word) return;
    if (word.audioUrl) {
      audioRef.current = new Audio(word.audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => setIsPlaying(false);
    }
    if (word.location && isRealWord) {
      setLoading(true);
      analyzeWord(word.location).then(s => { setStats(s); setLoading(false); }).catch(() => setLoading(false));
    }
    return () => { audioRef.current?.pause(); audioRef.current = null; };
  }, [word?.id, availableEditions]);

  const loadTafsir = useCallback(() => {
    if (!word?.location || tafsirLoading) return;
    const [s, v] = word.location.split(':');
    setTafsirLoading(true);
    const edition = availableEditions.find(e => e.id === activeTafsirId) || availableEditions[0];
    fetchFullTafsir(`${s}:${v}`, edition.id, edition.apiId).then(html => {
      setTafsirHtml(html || '<p>Tafsir not available for this verse.</p>');
      setTafsirLoading(false);
    });
  }, [word, activeTafsirId, tafsirLoading, availableEditions]);

  useEffect(() => {
    if (activeTab === 'tafsir' && word?.location) {
      setTafsirHtml(null);
      loadTafsir();
    }
  }, [activeTafsirId]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); setIsPlaying(true); }
  };

  const copyWord = () => {
    if (!word) return;
    navigator.clipboard.writeText(`${word.text}\n${word.transliteration}\n${word.translation}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  const root = stats?.root;
  const lemma = stats?.lemma;
  const pos = stats?.pos;
  const features = stats?.features || [];
  const rootChars = root ? root.split('') : [];
  const gramCase = features.find(f => ['NOM', 'ACC', 'GEN'].includes(f));

  const VERSES_PREVIEW = 12;
  const RELATED_PREVIEW = 8;
  const displayedVerses = versesExpanded
    ? stats?.allVersesWithRoot || []
    : (stats?.allVersesWithRoot || []).slice(0, VERSES_PREVIEW);
  const displayedRelated = relatedExpanded
    ? stats?.allRelatedLemmas || []
    : (stats?.allRelatedLemmas || []).slice(0, RELATED_PREVIEW);

  return (
    <Drawer open={!!word} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent
        className="rounded-t-[2.5rem] bg-gradient-to-b from-primary/10 via-background to-background border-none focus:outline-none max-h-[80vh] flex flex-col"
        handleStyle={{ width: 40, height: 20, backgroundColor: 'rgba(0,0,0,0.25)' }}
      >
        {word && (
          <>
            {/* ── Hero ── */}
            <div className="px-6 pt-6 pb-4 text-center shrink-0">
              <DrawerTitle className="sr-only">Word: {word.transliteration}</DrawerTitle>
              <DrawerDescription className="sr-only">Full linguistic analysis of a Quranic word.</DrawerDescription>
              <p className="arabic-text text-6xl text-foreground mb-3 leading-tight">{word.text}</p>
              <div className="flex items-center justify-center gap-2.5">
                {word.transliteration && (
                  <p className="italic font-display text-lg text-primary">{word.transliteration}</p>
                )}
                {word.audioUrl && (
                  <button onClick={toggleAudio} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-sm ${isPlaying ? 'bg-primary text-white scale-110' : 'bg-card border border-border text-primary'}`}>
                    {isPlaying ? <Pause size={14} /> : <Volume2 size={14} />}
                  </button>
                )}
                <button onClick={copyWord} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${copied ? 'bg-green-500/10 text-green-600' : 'bg-card border border-border text-muted-foreground'}`}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                {word.location && (
                  <a href={`http://corpus.quran.com/wordbyword.jsp?chapter=${word.location.split(':')[0]}&verse=${word.location.split(':')[1]}`} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-card border border-border text-muted-foreground flex items-center justify-center">
                    <Globe size={14} />
                  </a>
                )}
              </div>
              {/* Stats bar */}
              <div className="flex items-center justify-center gap-3 mt-3 flex-wrap">
                {word.location && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full">
                    <Hash size={9} />{word.location.split(':').join(' : ')}
                  </span>
                )}
                {loading && <Loader2 size={11} className="animate-spin text-muted-foreground" />}
                {!loading && root && (
                  <span className="text-[10px] text-muted-foreground bg-primary/8 text-primary px-2.5 py-1 rounded-full font-semibold">
                    Root <span className="arabic-text text-sm">{root}</span> · {stats?.rootFrequency}× · {stats?.uniqueVersesCount} verses
                  </span>
                )}
                {!loading && stats && !root && pos && (
                  <span className="text-[10px] text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full">{POS_LABELS[pos]}</span>
                )}
              </div>
            </div>

            {/* ── Tab Bar ── */}
            <div className="flex gap-1.5 px-5 py-2 border-b border-border/50 shrink-0">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); if (id === 'tafsir') loadTafsir(); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all ${activeTab === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'}`}
                >
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>

            {/* ── Scrollable Tab Content ── */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 space-y-3 pb-6">

              {/* ════════ OVERVIEW TAB ════════ */}
              {activeTab === 'overview' && (
                <>
                  {/* Translation — FULL */}
                  <div className="bg-card border border-border/60 rounded-[1.5rem] p-5">
                    <span className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">Translation</span>
                    <p className="text-[17px] font-semibold text-foreground leading-relaxed">{word.translation}</p>
                    {word.transliteration && (
                      <p className="text-sm italic text-primary/70 mt-1.5 font-display">{word.transliteration}</p>
                    )}
                  </div>

                  {/* Root Block */}
                  {isRealWord && (
                    <div className="bg-card border border-border/60 rounded-[1.5rem] p-5 space-y-4">
                      <span className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Root Word (جَذْر)</span>
                      {loading ? (
                        <div className="flex items-center gap-2 text-muted-foreground py-2"><Loader2 size={14} className="animate-spin" /><span className="text-sm">Analyzing corpus…</span></div>
                      ) : root ? (
                        <>
                          {/* Root letter boxes — RTL: 1st on right */}
                          <div className="flex items-center justify-center py-2" dir="rtl">
                            {rootChars.map((char, i) => {
                              const total = rootChars.length;
                              const label = total === 3 ? ['1st', '2nd', '3rd'][i] : `R${i + 1}`;
                              return (
                                <div key={i} className="flex items-center">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                      <span className="arabic-text text-2xl text-primary">{char}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
                                  </div>
                                  {i < total - 1 && (
                                    <div className="w-5 h-px bg-border mx-2 mb-4" />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Key info grid */}
                          <div className="space-y-2">
                            {lemma && (
                              <div className="flex items-center justify-between py-2 border-b border-border/30">
                                <span className="text-xs text-muted-foreground">Dictionary form (Lemma)</span>
                                <span className="arabic-text text-xl text-foreground">{lemma}</span>
                              </div>
                            )}
                            {pos && (
                              <div className="flex items-center justify-between py-2 border-b border-border/30">
                                <span className="text-xs text-muted-foreground">Part of speech</span>
                                <span className="text-sm font-semibold text-foreground">{POS_LABELS[pos] || pos}</span>
                              </div>
                            )}
                            {stats?.verbForm && (
                              <div className="flex items-center justify-between py-2 border-b border-border/30">
                                <span className="text-xs text-muted-foreground">Verb form</span>
                                <span className="text-sm font-semibold text-foreground">{FEATURE_LABELS[stats.verbForm] || stats.verbForm}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between py-2 border-b border-border/30">
                              <span className="text-xs text-muted-foreground">Root frequency in Quran</span>
                              <span className="text-sm font-bold text-primary">{stats?.rootFrequency} morphemes · {stats?.uniqueVersesCount} verses</span>
                            </div>
                          </div>

                          {/* Case explainer */}
                          {gramCase && CASE_EXPLAIN[gramCase] && (
                            <div className="bg-primary/5 rounded-2xl p-3 border border-primary/10">
                              <p className="text-[12px] text-muted-foreground leading-[1.75]">{CASE_EXPLAIN[gramCase]}</p>
                            </div>
                          )}

                          {/* Root description */}
                          <div className="bg-muted/30 rounded-2xl p-4 text-[12.5px] text-muted-foreground leading-[1.8] space-y-2">
                            <p>Arabic words are built from <span className="font-semibold text-foreground">root letters (جَذْر)</span> — typically 3 consonants carrying a core semantic meaning. All words formed from the same root are semantically related.</p>
                            <p>For a full study of the root <span className="arabic-text text-base text-primary font-bold">{root}</span>, consult <span className="font-medium text-foreground">Lisan al-Arab (لِسَان العَرَب)</span> by Ibn Manẓūr or <span className="font-medium text-foreground">Al-Mufradat (المُفْرَدَات)</span> by Al-Rāghib al-Aṣfahānī — the definitive source for Quranic vocabulary.</p>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3 pt-1">
                          {pos && <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Part of speech</span><span className="text-sm font-semibold text-foreground">{POS_LABELS[pos] || pos}</span></div>}
                          <p className="text-sm text-muted-foreground italic">This word — a {pos ? (POS_LABELS[pos] || pos).toLowerCase() : 'function word'} — does not have a classical Arabic root. Particles, conjunctions, and pronouns carry grammatical meaning rather than a root-based lexical meaning.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Verses with same root — FULLY expanded */}
                  {isRealWord && root && stats && stats.allVersesWithRoot.length > 0 && (
                    <div className="bg-card border border-border/60 rounded-[1.5rem] overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4">
                        <div>
                          <span className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Verses containing this root</span>
                          <span className="text-xs text-muted-foreground mt-0.5">{stats.uniqueVersesCount} verses total</span>
                        </div>
                        <span className="arabic-text text-lg text-primary font-bold">{root}</span>
                      </div>
                      <div className="px-5 pb-4 border-t border-border/40 pt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {displayedVerses.map(vk => (
                            <span key={vk} className="px-2.5 py-1 rounded-full bg-muted/60 text-[11px] font-mono text-foreground border border-border/40">{vk}</span>
                          ))}
                        </div>
                        {(stats.allVersesWithRoot.length > VERSES_PREVIEW) && (
                          <button onClick={() => setVersesExpanded(e => !e)} className="flex items-center gap-1 mt-3 text-xs text-primary font-semibold">
                            {versesExpanded ? <><ChevronUp size={13} />Show less</> : <><ChevronDown size={13} />Show all {stats.allVersesWithRoot.length} verses</>}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Related words (same root) — FULLY listed */}
                  {isRealWord && root && stats && stats.allRelatedLemmas.length > 0 && (
                    <div className="bg-card border border-border/60 rounded-[1.5rem] overflow-hidden">
                      <div className="px-5 py-4 flex items-center justify-between">
                        <div>
                          <span className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Related words (same root)</span>
                          <span className="text-xs text-muted-foreground mt-0.5">{stats.allRelatedLemmas.length} word forms</span>
                        </div>
                      </div>
                      <div className="px-5 pb-4 border-t border-border/40 pt-3 space-y-2">
                        {displayedRelated.map(({ lemma: l, count }) => (
                          <div key={l} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                            <span className="arabic-text text-[22px] text-foreground leading-tight">{l}</span>
                            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{count}× in Quran</span>
                          </div>
                        ))}
                        {stats.allRelatedLemmas.length > RELATED_PREVIEW && (
                          <button onClick={() => setRelatedExpanded(e => !e)} className="flex items-center gap-1 pt-1 text-xs text-primary font-semibold">
                            {relatedExpanded ? <><ChevronUp size={13} />Show fewer</> : <><ChevronDown size={13} />Show all {stats.allRelatedLemmas.length} word forms</>}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ════════ GRAMMAR TAB ════════ */}
              {activeTab === 'grammar' && (
                <>
                  {loading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 size={18} className="animate-spin" /><span>Parsing morphology…</span></div>
                  ) : stats ? (
                    <>
                      {/* Grammatical features */}
                      {features.length > 0 && (
                        <div className="bg-card border border-border/60 rounded-[1.5rem] p-5">
                          <span className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">Grammatical Properties</span>
                          <div className="flex flex-wrap gap-2">
                            {features.map((f, i) => (
                              <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${['NOM','ACC','GEN'].includes(f) ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                {FEATURE_LABELS[f] || f}
                              </span>
                            ))}
                          </div>
                          {gramCase && CASE_EXPLAIN[gramCase] && (
                            <div className="mt-3 bg-muted/30 rounded-xl p-3 text-[12px] text-muted-foreground leading-[1.75]">
                              {CASE_EXPLAIN[gramCase]}
                            </div>
                          )}
                        </div>
                      )}

                      {/* All morpheme segments — COMPLETE */}
                      {stats.morphemes.length > 0 && (
                        <div className="bg-card border border-border/60 rounded-[1.5rem] p-5">
                          <span className="block text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">Morpheme Breakdown</span>
                          <div className="space-y-3">
                            {stats.morphemes.map((m, i) => (
                              <div key={i} className={`rounded-2xl p-4 ${m.isAffix ? 'bg-secondary/30 border border-border/30' : 'bg-primary/5 border border-primary/10'}`}>
                                <div className="flex items-start justify-between mb-2">
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${m.isAffix ? 'text-muted-foreground' : 'text-primary'}`}>
                                    {m.isAffix ? 'Affix' : 'Core Morpheme'}
                                  </span>
                                  {m.lemma && <span className="arabic-text text-xl text-foreground">{m.lemma}</span>}
                                </div>
                                {m.pos && <p className="text-sm font-semibold text-foreground">{POS_LABELS[m.pos] || m.pos}</p>}
                                {m.root && <p className="text-xs text-muted-foreground mt-0.5">Root: <span className="arabic-text text-primary font-semibold">{m.root}</span></p>}
                                {m.features.filter(f => !f.startsWith('VF:')).length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {m.features.filter(f => !f.startsWith('VF:')).map((f, fi) => (
                                      <span key={fi} className="px-2 py-0.5 bg-background/80 rounded-full text-[10px] text-muted-foreground border border-border/30">{FEATURE_LABELS[f] || f}</span>
                                    ))}
                                  </div>
                                )}
                                {m.verbForm && (
                                  <p className="text-xs text-muted-foreground mt-1.5">{FEATURE_LABELS[m.verbForm]}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Arabic grammar primer */}
                      <div className="bg-muted/30 border border-border/30 rounded-[1.5rem] p-5 space-y-3 text-[12.5px] text-muted-foreground leading-[1.85]">
                        <p className="font-bold text-foreground text-sm">Arabic Morphology (الصَّرْف)</p>
                        <p>Arabic is a root-based language. Words are constructed by placing root consonants into vowel patterns called <em>awzān</em> (أَوْزَان), which determine the word's meaning, grammatical role, and derivational family.</p>
                        {stats.verbForm && (
                          <p>The verb form (وَزْن) of this word is <span className="font-semibold text-foreground">{FEATURE_LABELS[stats.verbForm]}</span>, which changes the meaning relative to the base Form I.</p>
                        )}
                        {gramCase && (
                          <p>The word is in the <span className="font-semibold text-foreground">{FEATURE_LABELS[gramCase] || gramCase}</span> case, indicating its syntactic function in the sentence.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-12 italic">No grammar data available for this word.</p>
                  )}
                </>
              )}

              {/* ════════ TAFSIR TAB ════════ */}
              {activeTab === 'tafsir' && (
                <>
                  {<div className="flex items-center justify-between bg-card border border-border/60 rounded-[1.5rem] px-5 py-3 mb-3">
                    <span className="text-xs font-semibold text-foreground">Edition</span>
                    <select
                      value={activeTafsirId}
                      onChange={(e) => setActiveTafsirId(e.target.value)}
                      className="bg-muted/50 border border-border/60 text-sm font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    >
                      {availableEditions.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>}

                  {tafsirLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground"><Loader2 size={18} className="animate-spin" /><span>Loading tafsir…</span></div>
                  ) : tafsirHtml ? (
                    <>
                      <div className="bg-card border border-border/60 rounded-[1.5rem] p-5">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{availableEditions.find(e => e.id === activeTafsirId)?.name}</span>
                          {word.location && (
                            <span className="text-[10px] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full font-mono">
                              {word.location.split(':').slice(0, 2).join(':')}
                            </span>
                          )}
                        </div>
                        {/* Full HTML tafsir rendered */}
                        <div
                          className="text-[13.5px] text-foreground/90 leading-[2] space-y-3
                            [&_h1]:text-[15px] [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-4 [&_h1]:mb-2
                            [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:text-foreground/80 [&_h2]:mt-3 [&_h2]:mb-1
                            [&_p]:mb-2 [&_strong]:font-semibold [&_strong]:text-foreground
                            [&_em]:italic [&_em]:text-muted-foreground
                            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                            [&_li]:text-[13px]"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tafsirHtml) }}
                        />
                      </div>
                      {word.location && activeTafsirId.includes('jalalayn') === false && (
                        <a
                          href={`https://quran.com/${word.location.split(':').slice(0, 2).join('/')}/tafsirs/${activeTafsirId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between bg-card border border-border/60 rounded-[1.5rem] px-5 py-4 hover:bg-muted/30 transition-colors"
                        >
                          <span className="text-sm text-muted-foreground">Read full tafsir on Quran.com</span>
                          <ExternalLink size={14} className="text-primary" />
                        </a>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground text-sm italic">Select the Tafsir tab to load Ibn Kathir.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-10 pt-3 bg-background border-t border-border/60 shrink-0">
              <button onClick={onClose} className="w-full bg-muted hover:bg-muted/80 text-muted-foreground font-medium py-3.5 rounded-full transition-colors text-sm">
                Close
              </button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
