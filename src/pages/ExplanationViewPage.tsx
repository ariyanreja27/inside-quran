import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { X, Volume2, Info, SquarePen, Share2, BookOpen, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurahVerses, useSurahs } from '@/hooks/useQuranData';
import { formatVerseRange } from '@/lib/utils';
import { useExplanations, useSettings, useCustomTranslations } from '@/hooks/useAppStore';
import type { Explanation, RootWord } from '@/types/quran';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export default function ExplanationViewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const explanationId = searchParams.get('id');
  const surahNumber = searchParams.get('surah') ? Number(searchParams.get('surah')) : null;
  const verseNumber = searchParams.get('verse') ? Number(searchParams.get('verse')) : null;

  const { getExplanation, explanations, deleteExplanation } = useExplanations();
  const { data: surahs } = useSurahs();
  const { settings } = useSettings();
  const { getCustomTranslation } = useCustomTranslations();

  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [activeTab, setActiveTab] = useState<'concise' | 'deeper' | 'ask'>('concise');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      if (explanation) deleteExplanation(explanation.id);
      navigate(-1);
    }, 300);
  };

  const scrolledRef = useRef(false);

  useEffect(() => {
    let match: Explanation | undefined;
    if (explanationId) {
      match = explanations.find(e => e.id === explanationId);
    } else if (surahNumber && verseNumber) {
      match = getExplanation(surahNumber, verseNumber);
    }
    setExplanation(match || null);
    scrolledRef.current = false;
    
    if (match) {
        if (!match.concise?.length && (match.deeperLook?.rootWords?.length || match.deeperLook?.categories?.length)) {
            setActiveTab('deeper');
        }
    }
  }, [explanationId, surahNumber, verseNumber, explanations, getExplanation]);

  const { data: currentSurahVerses } = useSurahVerses(explanation?.surahNumber || 1);
  const surah = surahs?.find(s => s.number === explanation?.surahNumber);

  const getVerse = (num: number) => {
    return currentSurahVerses?.find(a => a.numberInSurah === num);
  };

  // Scroll to the target verse block once content is ready
  useEffect(() => {
    if (!verseNumber || scrolledRef.current || !explanation) return;

    // First verse block = no scroll needed (page starts at top naturally)
    const firstVerseNumber = explanation.concise?.[0]?.verseNumber;
    if (verseNumber === firstVerseNumber) {
      scrolledRef.current = true;
      window.scrollTo({ top: 0 });
      return;
    }

    const el = document.getElementById(`verse-block-${verseNumber}`);
    if (el) {
      scrolledRef.current = true;
      setTimeout(() => {
        // Account for the sticky header (~130px) so verse starts right below it
        const headerOffset = 160;
        const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top, behavior: 'smooth' });
      }, 350);
    }
  });

  const [selectedRootWord, setSelectedRootWord] = useState<RootWord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Pre-select first root word if none selected and tab is deeper
  useEffect(() => {
    if (activeTab === 'deeper' && explanation?.deeperLook?.rootWords?.length && !selectedRootWord) {
      // Don't auto-open modal, just select the active pill if we were building an inline UI.
    }
  }, [activeTab, explanation, selectedRootWord]);

  // We'll use selectedRootWord for isActive
  const handleOpenRootWord = (rw: RootWord) => {
    setSelectedRootWord(rw);
    setIsDrawerOpen(true);
  };

  const tabs = ['concise', 'deeper', 'ask'] as const;
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const idx = tabs.indexOf(activeTab);
      if (idx !== -1 && idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
    },
    onSwipedRight: () => {
      const idx = tabs.indexOf(activeTab);
      if (idx > 0) setActiveTab(tabs[idx - 1]);
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 40,
  });

  if (!explanation) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
         <p className="text-muted-foreground mb-4">Explanation not found, or there are no notes here yet.</p>
         <button onClick={() => navigate(`/explanation-builder${surahNumber && verseNumber ? `?surah=${surahNumber}&verse=${verseNumber}` : ''}`)} className="bg-[#5A2A31] text-white rounded-full px-6 py-3 font-medium">Add Explanation</button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {!isDeleting && (
        <motion.div {...handlers} exit={{ opacity: 0, scale: 0.96, y: 15 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="min-h-screen bg-background pb-24">
      
      {/* Sticky Header block */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pt-5 pb-4 mb-6 border-b border-border/50 shadow-sm transform-gpu">
        {/* Top Floating Buttons */}
        <div className="flex items-center justify-between px-5 mb-5">
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

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button 
                  className="w-9 h-9 bg-card border border-border rounded-full flex items-center justify-center text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition active:scale-95 shadow-sm"
                  aria-label="Delete Explanation"
                >
                  <Trash2 size={14} />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-[1.5rem]">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Explanation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this explanation? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex gap-2 sm:gap-0 mt-2">
                  <AlertDialogCancel className="rounded-xl border-border h-11">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground h-11"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

          </div>
        </div>

        {/* Tabs and Actions Row */}
        <div className="px-5">
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
                      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    />
                  )}
                  {tab === 'concise' ? 'Concise' : tab === 'deeper' ? 'Deeper Look' : 'Ask Ustadh'}
                </motion.button>
              );
            })}
          </div>
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
                   const hasExplanationContent = block.explanations.some(exp => exp.text?.trim().length > 0);
                   if (!hasExplanationContent) return null;
                   
                   const verseData = getVerse(block.verseNumber);
                   return (
                     <div key={i} id={`verse-block-${block.verseNumber}`} className="space-y-6">
                        {/* Divider logic for Verse blocks! */}
                        <div className="flex items-center gap-4">
                           <div className="h-px bg-border flex-1"></div>
                           <span className="text-primary font-display font-medium italic text-[15px]">Verse {block.verseNumber}</span>
                           <div className="h-px bg-border flex-1"></div>
                        </div>
                        
                        {/* Verse Text Box */}
                        {verseData && (
                          <div className="bg-card/50 dark:bg-card/30 rounded-3xl p-6 flex items-center justify-center min-h-[100px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] mb-6 border border-border/50">
                             <p className="font-arabic text-3xl leading-loose text-center text-foreground" style={{ fontSize: `${settings.arabicFontSize + 6}px` }} dangerouslySetInnerHTML={{ __html: (verseData.text || '').replace('بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', '<span class="bismillah-text text-2xl block -mb-4">﷽</span>') }} />
                          </div>
                        )}

                        {/* Translation */}
                        {verseData && (
                          <p className="italic text-muted-foreground text-[16px] leading-relaxed mb-8" style={{ fontSize: `${settings.translationFontSize}px` }}>
                             "{getCustomTranslation(explanation.surahNumber, block.verseNumber, settings.language) || verseData.translation}"
                          </p>
                        )}

                        {/* Explanations */}
                        <div className="space-y-8">
                           {block.explanations.map((exp, j) => (
                             exp.text?.trim().length > 0 && (
                               <div key={j}>
                                  {exp.title && <h3 className="font-display font-semibold text-[17px] text-foreground mb-3">{exp.title}</h3>}
                                  <div className="prose prose-sm max-w-none text-muted-foreground leading-[1.8] text-[16px]
                                    prose-headings:font-display prose-headings:font-bold prose-headings:text-foreground 
                                    prose-headings:mt-6 prose-headings:mb-3
                                    prose-strong:font-bold prose-strong:text-foreground">
                                     <ReactMarkdown remarkPlugins={[remarkGfm]}>{exp.text}</ReactMarkdown>
                                  </div>
                               </div>
                             )
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

                {(explanation.deeperLook?.rootWords?.length > 0 || explanation.deeperLook?.categories?.length > 0) && (() => {
                   const verseText = explanation.verseRange || (explanation.verses ? formatVerseRange(explanation.verses) : '');
                   const isMultiple = verseText.includes('-') || verseText.includes(',');
                   return (
                     <div className="uppercase text-[12px] text-muted-foreground tracking-[0.15em] font-semibold mb-6 text-center">
                        {isMultiple ? 'VERSES' : 'VERSE'} {verseText}
                     </div>
                   );
                })()}

                {explanation.deeperLook?.rootWords?.length > 0 && (
                   <div className="space-y-4 mb-10">
                      <div className="uppercase text-[12px] text-muted-foreground tracking-[0.15em] font-semibold mb-3">
                         ROOT WORDS
                      </div>
                      
                      <div className="flex flex-wrap gap-2.5">
                         {explanation.deeperLook.rootWords.map((rw) => {
                            const isActive = selectedRootWord?.id === rw.id && isDrawerOpen;
                            return (
                              <button
                                 key={rw.id}
                                 onClick={() => handleOpenRootWord(rw)}
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
      <Drawer 
        open={isDrawerOpen} 
        onOpenChange={(open) => {
          setIsDrawerOpen(open);
          if (!open) {
            setTimeout(() => setSelectedRootWord(null), 350);
            if (document.activeElement instanceof HTMLElement) {
              document.activeElement.blur();
            }
          }
        }}
      >
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
                     <button 
                        onClick={() => {
                          setIsDrawerOpen(false);
                          setTimeout(() => setSelectedRootWord(null), 350);
                        }} 
                        className="w-full bg-muted hover:bg-muted/80 text-muted-foreground font-medium py-[14px] rounded-full transition-colors text-[15px]"
                     >
                        Close
                     </button>
                  </div>
               </>
            )}
         </DrawerContent>
      </Drawer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
