import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MoreVertical, BookmarkCheck, Bookmark as BookmarkIcon, FileText, Pencil, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurahVerses, useSurahs } from '@/hooks/useQuranData';
import { useBookmarks, useExplanations, useLastPosition, useLastRead, useSettings, useCustomTranslations } from '@/hooks/useAppStore';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import type { Verse } from '@/types/quran';

export default function SurahReadingPage() {
  const { number } = useParams<{ number: string }>();
  const surahNumber = parseInt(number || '1');
  const navigate = useNavigate();
  const { data: surahs } = useSurahs();
  const { data: verses, isLoading } = useSurahVerses(surahNumber);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetVerse = queryParams.get('verse');
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { hasExplanation, getExplanation } = useExplanations();
  const { setPosition } = useLastPosition();
  const { settings } = useSettings();
  const { getCustomTranslation, saveCustomTranslation, resetCustomTranslation } = useCustomTranslations();
  const { saveLastRead } = useLastRead();
  
  const [isRendered, setIsRendered] = useState(false);
  const [menuVerse, setMenuVerse] = useState<number | null>(null);
  const [currentJuz, setCurrentJuz] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [editingVerse, setEditingVerse] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  
  const editingVerseObj = verses?.find(a => a.numberInSurah === editingVerse);
  const activeCustomTrans = editingVerse ? getCustomTranslation(surahNumber, editingVerse, settings.language) : null;
  const isSaveDisabled = !editingVerseObj || editText.trim() === '' || editText.trim() === (activeCustomTrans || editingVerseObj.translation).trim();
  const isResetDisabled = !activeCustomTrans;

  const menuRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const surah = surahs?.find(s => s.number === surahNumber);

  useEffect(() => {
    if (surahNumber && !targetVerse) {
      setPosition({ surahNumber, verseNumber: 1 });
      saveLastRead(surahNumber, 1);
    } else if (surahNumber && targetVerse) {
      const targetInt = parseInt(targetVerse);
      setPosition({ surahNumber, verseNumber: targetInt });
      saveLastRead(surahNumber, targetInt);
    }
  }, [surahNumber, targetVerse, setPosition, saveLastRead]);

  useEffect(() => {
    if (verses && verses.length > 0 && !currentJuz) {
      setCurrentJuz(verses[0].juz);
      setCurrentPage(verses[0].page);
    }
  }, [verses, currentJuz]);

  useEffect(() => {
    if (!isRendered || isLoading) return;

    let scrollTimeout: NodeJS.Timeout;
    const headerOffset = 70; // 56px sticky header + 14px safety buffer

    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        const verseElements = document.querySelectorAll('[id^="verse-"]');
        let topMostVerseNum = -1;

        for (let i = 0; i < verseElements.length; i++) {
          const el = verseElements[i];
          const arabicEl = el.querySelector('.arabic-text');
          const transEl = el.querySelector('p.font-display.text-muted-foreground');
          
          let isVisible = false;

          if (arabicEl) {
            const rect = arabicEl.getBoundingClientRect();
            if (rect.bottom > headerOffset && rect.top < window.innerHeight) {
              isVisible = true;
            }
          }

          if (transEl && !isVisible) {
            const rect = transEl.getBoundingClientRect();
            if (rect.bottom > headerOffset && rect.top < window.innerHeight) {
              isVisible = true;
            }
          }

          // Fallback if neither exists
          if (!arabicEl && !transEl) {
            const rect = el.getBoundingClientRect();
            if (rect.bottom > headerOffset && rect.top < window.innerHeight) {
              isVisible = true;
            }
          }

          if (isVisible) {
            topMostVerseNum = parseInt(el.id.split('-')[1]);
            break;
          }
        }

        if (topMostVerseNum !== -1) {
          const verse = verses?.find(a => a.numberInSurah === topMostVerseNum);
          if (verse) {
            setCurrentJuz(verse.juz);
            setCurrentPage(verse.page);
            if (surahNumber) {
              if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
              saveTimeoutRef.current = setTimeout(() => {
                saveLastRead(surahNumber, topMostVerseNum);
              }, 400); // 400ms exit-debounce prevents browser scroll restoration bugs
            }
          }
        }
      }, 100); // Highly efficient 100ms throttle
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check state immediately after rendering

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [verses, isLoading, surahNumber, saveLastRead, isRendered]);

  // Scroll to target verse if provided in URL
  useEffect(() => {
    if (!isLoading && targetVerse && verses && isRendered) {
      const element = document.getElementById(`verse-${targetVerse}`);
      if (element) {
        setTimeout(() => {
          const headerOffset = 64; // 56px header + 8px padding
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - headerOffset,
            behavior: 'smooth'
          });
          
          // Highlight effect
          element.classList.add('ring-2', 'ring-primary/50', 'bg-primary/5');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary/50', 'bg-primary/5');
          }, 2000);
        }, 300);
      }
    }
  }, [isLoading, targetVerse, verses, isRendered]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuVerse(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  let lastJuz = 0;
  let lastPage = 0;
  let lastRuku = 0;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3 px-4 h-14">
          <button onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate('/');
            }
          }} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition">
            <ArrowLeft size={20} />
          </button>
          {isLoading ? (
            <div className="flex-1 space-y-2 animate-pulse mt-1 ml-2">
              <div className="h-4 bg-foreground/10 rounded block w-24" />
              <div className="h-2 bg-foreground/10 rounded block w-16" />
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <h2 className="font-display font-semibold text-sm truncate">{surah?.name}</h2>
                <p className="text-[10px] text-muted-foreground">{surah?.meaning}</p>
              </div>
              {currentJuz && (
                <div className="flex flex-col items-end text-[10px] text-muted-foreground font-medium pr-1">
                  <span>Juz {currentJuz}</span>
                  <span>Page {currentPage}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="animate-pulse"
          >
            {/* Calligraphy Skeleton */}
            <div className="text-center py-5 px-4 flex flex-col items-center gap-3">
              <div className="h-[65px] w-[200px] bg-foreground/5 rounded-2xl" />
              {surahNumber !== 1 && surahNumber !== 9 && (
                <div className="h-10 w-[150px] bg-foreground/5 rounded-xl mt-3" />
              )}
            </div>

            {/* Verses Skeleton */}
            <div className="px-4 space-y-3 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`skel-${i}`} className="bg-card rounded-2xl border border-border p-5 h-32 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <div className="w-8 h-8 rounded-lg bg-foreground/5" />
                    <div className="w-6 h-6 rounded-md bg-foreground/5" />
                  </div>
                  <div className="flex flex-col items-center gap-3 mt-4">
                    <div className="h-4 bg-foreground/5 rounded-full w-3/4" />
                    <div className="h-4 bg-foreground/5 rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Bismillah & Surah Calligraphy */}
            <div className="text-center py-5 px-4 flex flex-col items-center gap-1">
              <p className="surah-calligraphy ">
                surah{surahNumber.toString().padStart(3, '0')} surah-icon
              </p>
              {surahNumber !== 1 && surahNumber !== 9 && (
                <p className="bismillah-text text-4xl leading-normal mt-3 -mb-4 border-b-0">
                  ﷽
                </p>
              )}
            </div>

            {/* Verses */}
            <div 
              className="px-4 space-y-3 mt-2"
              ref={(el) => { if (el && !isRendered) setIsRendered(true); }}
            >
              {verses?.map((verse) => {
            const dividers: string[] = [];
            if (verse.juz !== lastJuz) { dividers.push(`Juz ${verse.juz}`); lastJuz = verse.juz; }
            if (verse.page !== lastPage) { dividers.push(`Page ${verse.page}`); lastPage = verse.page; }
            if (verse.ruku !== lastRuku) { dividers.push(`Ruku ${verse.ruku}`); lastRuku = verse.ruku; }

            const explained = hasExplanation(surahNumber, verse.numberInSurah);
            const bookmarked = isBookmarked(surahNumber, verse.numberInSurah);
            const customTrans = getCustomTranslation(surahNumber, verse.numberInSurah, settings.language);
            const displayTranslation = customTrans || verse.translation;

            if (settings.showOnlyExplained && !explained) return null;

            return (
              <div key={verse.numberInSurah}>
                {dividers.length > 0 && (
                  <div className="flex items-center justify-center gap-2 py-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="divider-label">{dividers.join(' • ')}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: Math.min(verse.numberInSurah * 0.02, 1) }}
                  id={`verse-${verse.numberInSurah}`}
                  className="relative verse-card transition-all duration-500 rounded-2xl"
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-xs font-semibold text-primary">
                        {verse.numberInSurah}
                      </span>
                      {bookmarked && (
                        <BookmarkCheck size={14} className="text-gold" />
                      )}
                    </div>
                    <div className="relative" ref={menuVerse === verse.numberInSurah ? menuRef : undefined}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuVerse(menuVerse === verse.numberInSurah ? null : verse.numberInSurah);
                        }}
                        className="p-1.5 rounded-lg hover:bg-secondary transition"
                      >
                        <MoreVertical size={16} className="text-muted-foreground" />
                      </button>
                      {menuVerse === verse.numberInSurah && (
                        <div className="absolute right-0 top-8 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(surahNumber, verse.numberInSurah);
                              setMenuVerse(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-[15px] font-medium hover:bg-secondary transition text-foreground/90"
                          >
                            <BookmarkIcon size={16} className="text-muted-foreground mr-1" />
                            {bookmarked ? 'Remove Bookmark' : 'Bookmark'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuVerse(null);
                              if (explained) {
                                navigate(`/explanation-view?surah=${surahNumber}&verse=${verse.numberInSurah}`);
                              } else {
                                navigate(`/explanation-builder?surah=${surahNumber}&verse=${verse.numberInSurah}`);
                              }
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-[15px] font-medium hover:bg-secondary transition text-foreground/90"
                          >
                            <BookOpen size={16} className="text-muted-foreground mr-1" />
                            {explained ? 'View Explanation' : 'Add Explanation'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditText(customTrans || verse.translation);
                              setEditingVerse(verse.numberInSurah);
                              setMenuVerse(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-[15px] font-medium hover:bg-secondary transition text-foreground/90"
                          >
                            <Pencil size={16} className="text-muted-foreground mr-1" />
                            Edit Translation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arabic */}
                  <p
                    className="arabic-text text-center text-foreground mb-4"
                    style={{
                      fontSize: `${settings.arabicFontSize}px`,
                      lineHeight: settings.lineSpacing
                    }}
                  >
                    {verse.text}
                  </p>

                  {/* Translation */}
                  <p
                    className="font-display text-muted-foreground"
                    style={{
                      fontSize: `${settings.translationFontSize}px`,
                      lineHeight: 1.6,
                      direction: settings.language === 'ur' ? 'rtl' : 'ltr',
                      fontVariationSettings: "'SOFT' 50, 'WONK' 0"
                    }}
                  >
                    {displayTranslation}
                  </p>
                </motion.div>
              </div>
            );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Translation Drawer */}
      <Drawer open={!!editingVerse} onOpenChange={(open) => !open && setEditingVerse(null)}>
         <DrawerContent className="rounded-t-[2rem] bg-white border-none focus:outline-none flex flex-col max-h-[90vh]">
            {editingVerse && (
               <>
                  <div className="flex-1 overflow-y-auto px-7 pt-5 scrollbar-hide">
                     <DrawerTitle className="font-display text-xl mb-1 text-foreground">Edit Translation</DrawerTitle>
                     <DrawerDescription className="text-muted-foreground mb-6">Create a custom translation for Verse {editingVerse}</DrawerDescription>
                     
                     <div className="mb-6">
                        <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                           CUSTOM TRANSLATION ({settings.language.toUpperCase()})
                        </label>
                        <textarea 
                           className="w-full bg-muted/30 border border-border rounded-2xl p-4 text-[15px] focus:outline-none focus:border-primary transition-colors min-h-[200px] resize-y"
                           value={editText}
                           onChange={(e) => setEditText(e.target.value)}
                           dir={settings.language === 'ur' ? 'rtl' : 'ltr'}
                           placeholder="Write your custom translation..."
                        />
                     </div>
                  </div>
                  
                  <div className="px-7 pb-10 pt-4 bg-background border-t border-border shrink-0 flex gap-3">
                     <button 
                        disabled={isResetDisabled}
                        onClick={() => {
                           resetCustomTranslation(surahNumber, editingVerse, settings.language);
                           setEditingVerse(null);
                        }} 
                        className={`flex-1 font-medium py-[14px] rounded-full transition-colors text-[15px] ${isResetDisabled ? 'bg-secondary text-muted-foreground/80 cursor-not-allowed' : 'bg-destructive/10 hover:bg-destructive/20 text-destructive'}`}
                     >
                        Reset
                     </button>
                     <button 
                        disabled={isSaveDisabled}
                        onClick={() => {
                           if (editText.trim()) {
                              saveCustomTranslation(surahNumber, editingVerse, settings.language, editText.trim());
                           }
                           setEditingVerse(null);
                        }} 
                        className={`flex-[2] font-medium py-[14px] rounded-full transition-colors text-[15px] ${isSaveDisabled ? 'bg-secondary text-muted-foreground/80 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
                     >
                        Save Translation
                     </button>
                  </div>
               </>
            )}
         </DrawerContent>
      </Drawer>

    </div>
  );
}
