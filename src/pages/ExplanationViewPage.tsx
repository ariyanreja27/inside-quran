import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Volume2, Info, SquarePen, Bookmark, MoreHorizontal, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurahAyahs, useSurahs } from '@/hooks/useQuranData';
import { useExplanations, useSettings } from '@/hooks/useAppStore';
import type { Explanation, RootWord } from '@/types/quran';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export default function ExplanationViewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const explanationId = searchParams.get('id');
  const surahNumber = searchParams.get('surah') ? Number(searchParams.get('surah')) : null;
  const ayahNumber = searchParams.get('ayah') ? Number(searchParams.get('ayah')) : null;

  const { getExplanation, explanations } = useExplanations();
  const { data: surahs } = useSurahs();
  const { settings } = useSettings();

  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [activeTab, setActiveTab] = useState<'concise' | 'deeper' | 'ask'>('concise');

  useEffect(() => {
    let match: Explanation | undefined;
    if (explanationId) {
      match = explanations.find(e => e.id === explanationId);
    } else if (surahNumber && ayahNumber) {
      match = getExplanation(surahNumber, ayahNumber);
    }
    setExplanation(match || null);
    
    if (match) {
        if (!match.concise?.length && (match.deeperLook?.rootWords?.length || match.deeperLook?.categories?.length)) {
            setActiveTab('deeper');
        }
    }
  }, [explanationId, surahNumber, ayahNumber, explanations, getExplanation]);

  const { data: currentSurahAyahs } = useSurahAyahs(explanation?.surahNumber || 1);
  const surah = surahs?.find(s => s.number === explanation?.surahNumber);

  const getAyah = (num: number) => {
    return currentSurahAyahs?.find(a => a.numberInSurah === num);
  };

  const [selectedRootWord, setSelectedRootWord] = useState<RootWord | null>(null);

  // Pre-select first root word if none selected and tab is deeper
  useEffect(() => {
    if (activeTab === 'deeper' && explanation?.deeperLook?.rootWords?.length && !selectedRootWord) {
      // Don't auto-open modal, just select the active pill if we were building an inline UI.
    }
  }, [activeTab, explanation, selectedRootWord]);

  // We'll use selectedRootWord for isActive

  if (!explanation) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
         <p className="text-muted-foreground mb-4">Explanation not found, or there are no notes here yet.</p>
         <button onClick={() => navigate(`/explanation-builder${surahNumber && ayahNumber ? `?surah=${surahNumber}&ayah=${ayahNumber}` : ''}`)} className="bg-[#5A2A31] text-white rounded-full px-6 py-3 font-medium">Add Explanation</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Floating Buttons */}
      <div className="flex items-center justify-between pt-6 px-5 mb-6">
        <button onClick={() => navigate(-1)} className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition shadow-sm">
          <X size={16} />
        </button>
        
        <div className="flex items-center gap-2">
          <button 
             onClick={() => navigate(`/explanation-builder?id=${explanation.id}`)} 
             className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition active:scale-95 shadow-sm"
             aria-label="Edit Explanation"
          >
            <SquarePen size={14} />
          </button>
          <button className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition shadow-sm">
            <Bookmark size={14} />
          </button>
          <button className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:bg-accent transition shadow-sm">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Tabs and Actions Row */}
      <div className="px-5 mb-10 flex flex-col gap-4">
        
        <div className="flex bg-muted/50 rounded-full p-[4px] w-full relative">
          {(['concise', 'deeper', 'ask'] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                whileTap={{ scale: 0.98 }}
                className={`relative flex-1 py-1.5 text-[13.5px] font-[500] rounded-full transition-colors tracking-wide z-10 ${
                  isActive 
                    ? 'text-primary-foreground' 
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab-view"
                    className="absolute inset-0 bg-primary rounded-full shadow-sm z-[-1]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab === 'concise' ? 'Concise' : tab === 'deeper' ? 'Deeper Look' : 'Ask Ustadh'}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="px-5 max-w-lg mx-auto overflow-hidden">
        <h2 className="font-display font-medium text-[22px] text-foreground text-center mb-10">Surah {surah?.name.replace('Surah ', '')}</h2>

        <AnimatePresence mode="wait">
          {activeTab === 'concise' && (
            <motion.div
              key="concise"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-12"
            >
                {explanation.concise?.length === 0 && (
                   <p className="text-center text-muted-foreground py-8">No concise explanations added.</p>
                )}
                {explanation.concise?.map((block, i) => {
                   const ayahData = getAyah(block.ayahNumber);
                   return (
                     <div key={i} className="space-y-6">
                        {/* Divider logic for Ayah blocks! */}
                        <div className="flex items-center gap-4">
                           <div className="h-px bg-border flex-1"></div>
                           <span className="text-primary font-display font-medium italic text-[15px]">Ayah {block.ayahNumber}</span>
                           <div className="h-px bg-border flex-1"></div>
                        </div>
                        
                        {/* Ayah Text Box */}
                        {ayahData && (
                          <div className="bg-card/50 dark:bg-card/30 rounded-3xl p-6 flex items-center justify-center min-h-[100px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] mb-6 border border-border/50">
                             <p className="font-arabic text-3xl leading-loose text-center text-foreground" style={{ fontSize: `${settings.arabicFontSize + 6}px` }} dangerouslySetInnerHTML={{ __html: ayahData.text.replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '<span class="bismillah-text text-2xl block mb-4">﷽</span>') }} />
                          </div>
                        )}

                        {/* Translation */}
                        {ayahData && (
                          <p className="italic text-muted-foreground text-[16px] leading-relaxed mb-8" style={{ fontSize: `${settings.translationFontSize}px` }}>
                             "{ayahData.translation}"
                          </p>
                        )}

                        {/* Explanations */}
                        <div className="space-y-8">
                           {block.explanations.map((exp, j) => (
                             <div key={j}>
                                {exp.title && <h3 className="font-display font-semibold text-[17px] text-foreground mb-3">{exp.title}</h3>}
                                <div className="prose prose-sm max-w-none text-muted-foreground leading-[1.8] text-[16px]
                                  prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground 
                                  prose-headings:mt-6 prose-headings:mb-3
                                  prose-strong:font-bold prose-strong:text-foreground">
                                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{exp.text}</ReactMarkdown>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   );
                })}
            </motion.div>
          )}

          {activeTab === 'deeper' && (
            <motion.div
              key="deeper"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-8 pb-10"
            >
                {(!explanation.deeperLook?.rootWords?.length && !explanation.deeperLook?.categories?.length) && (
                   <p className="text-center text-muted-foreground py-8">No deeper look data available.</p>
                )}

                {/* Assuming we are viewing Ayah 1 or the range... */}
                <div className="uppercase text-[12px] text-muted-foreground tracking-[0.15em] font-semibold mb-6">
                   AYAH {explanation.ayahRange || (explanation.ayahs?.length > 0 ? explanation.ayahs.join(', ') : '1')}
                </div>

                {explanation.deeperLook?.rootWords?.length > 0 && (
                   <div className="space-y-4 mb-10">
                      <div className="uppercase text-[12px] text-muted-foreground tracking-[0.15em] font-semibold mb-3">
                         ROOT WORDS
                      </div>
                      
                      <div className="flex flex-wrap gap-2.5">
                         {explanation.deeperLook.rootWords.map((rw) => {
                            const isActive = selectedRootWord?.id === rw.id;
                            return (
                              <button
                                 key={rw.id}
                                 onClick={() => setSelectedRootWord(rw)}
                                 className={`font-arabic text-[14px] px-[18px] py-1.5 rounded-full border transition-all ${
                                   isActive 
                                     ? 'bg-primary/20 border-primary/20 text-primary font-bold shadow-sm' 
                                     : 'bg-card border-border text-foreground hover:bg-accent'
                                 }`}
                              >
                                 {rw.arabic}
                              </button>
                            );
                         })}
                      </div>
                   </div>
                )}

                {explanation.deeperLook?.categories?.length > 0 && (
                   <div className="space-y-4">
                      <Accordion type="multiple" className="space-y-4 w-full">
                         {explanation.deeperLook.categories.map((cat) => (
                            <AccordionItem key={cat.id} value={cat.id} className="bg-card border-none rounded-[1.25rem] px-5 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_25px_rgba(0,0,0,0.06)] data-[state=open]:shadow-[0_4px_25px_rgba(0,0,0,0.08)] mb-4">
                               <AccordionTrigger className="hover:no-underline py-5 font-display font-medium text-[15.5px] text-foreground flex items-center justify-between">
                                  <span className="flex items-center gap-3">
                                     <BookOpen size={18} className="text-primary" />
                                     {cat.title}
                                  </span>
                               </AccordionTrigger>
                               <AccordionContent className="pb-6 pt-2">
                                  <div className="prose prose-sm max-w-none text-muted-foreground leading-[1.8] text-[15px]
                                    prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground 
                                    prose-headings:mt-6 prose-headings:mb-3
                                    prose-strong:font-bold prose-strong:text-foreground">
                                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{cat.content}</ReactMarkdown>
                                  </div>
                               </AccordionContent>
                            </AccordionItem>
                         ))}
                      </Accordion>
                   </div>
                )}
            </motion.div>
          )}

          {activeTab === 'ask' && (
            <motion.div
              key="ask"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="py-16 flex flex-col items-center justify-center text-center space-y-5"
            >
                <div className="w-20 h-20 bg-muted/50 text-primary rounded-full flex items-center justify-center mb-2">
                   <Info size={36} />
                </div>
                <h3 className="font-display font-medium text-xl text-foreground">Ask Ustadh</h3>
                <p className="text-[15px] text-muted-foreground max-w-[280px] leading-relaxed">
                   This feature is coming soon. You'll be able to ask verified scholars directly from your study notebook.
                </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Root Word Drawer */}
      <Drawer open={!!selectedRootWord} onOpenChange={(open) => !open && setSelectedRootWord(null)}>
         <DrawerContent className="rounded-t-[2rem] bg-white border-none focus:outline-none h-[80vh] flex flex-col">
            {selectedRootWord && (
               <>
                  <div className="flex-1 overflow-y-auto px-7 pt-5 scrollbar-hide">
                     <DrawerTitle className="sr-only">{selectedRootWord.transliteration}</DrawerTitle>
                     <DrawerDescription className="sr-only">Explanation of the root word</DrawerDescription>
                     
                     <div className="flex flex-col items-center">
                        {/* Top Word Header */}
                        <div className="mb-6 text-center mt-2">
                          <p className="font-arabic text-[40px] text-foreground mb-1 leading-normal">{selectedRootWord.arabic}</p>
                          <p className="italic font-display text-[15px] text-primary">{selectedRootWord.transliteration}</p>
                        </div>
                        
                        {/* Root Letters Box */}
                        <div className="w-full bg-muted/50 rounded-2xl p-6 text-center mb-6 shrink-0 border border-border/50">
                          <span className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-4">ROOT LETTERS</span>
                          <span className="font-arabic text-[22px] text-foreground" dir="rtl">{selectedRootWord.rootLetters}</span>
                        </div>
                        
                        <div className="w-full mb-10 text-pretty">
                           <div className="prose prose-sm max-w-none text-muted-foreground leading-[1.85] text-[15.5px] text-center
                             prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground 
                             prose-headings:mt-6 prose-headings:mb-3
                             prose-strong:font-bold prose-strong:text-foreground">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedRootWord.explanation}</ReactMarkdown>
                           </div>
                        </div>
                     </div>
                  </div>
                  
                  {/* Fixed Footer with Close Button */}
                  <div className="px-7 pb-10 pt-4 bg-background border-t border-border shrink-0">
                     <button onClick={() => setSelectedRootWord(null)} className="w-full bg-muted hover:bg-muted/80 text-muted-foreground font-medium py-[14px] rounded-full transition-colors text-[15px]">
                        Close
                     </button>
                  </div>
               </>
            )}
         </DrawerContent>
      </Drawer>
    </div>
  );
}
