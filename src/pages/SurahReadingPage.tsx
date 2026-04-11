import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MoreVertical, BookmarkCheck, Bookmark as BookmarkIcon, FileText, Pencil, BookOpen, PenLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurahVerses, useSurahs } from '@/hooks/useQuranData';
import { useBookmarks, useExplanations, useLastPosition, useLastRead, useSettings, useCustomTranslations, useCustomTafsirs, useNotes } from '@/hooks/useAppStore';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { TajweedText } from '@/components/TajweedText';
import { WordByWordVerse } from '@/components/WordByWordVerse';
import { WordDetailDrawer } from '@/components/WordDetailDrawer';
import type { Verse, Word } from '@/types/quran';

export default function SurahReadingPage() {
  const { number } = useParams<{ number: string }>();
  const navigate = useNavigate();
  const surahNumber = parseInt(number || '1');
  
  useEffect(() => {
    if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      navigate('/');
    }
  }, [surahNumber, navigate]);

  const { data: surahs } = useSurahs();
  const { data: verses, isLoading } = useSurahVerses(surahNumber);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetVerse = queryParams.get('verse');
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { hasExplanation, getExplanation } = useExplanations();
  const { hasTafsir } = useCustomTafsirs();
  const { setPosition } = useLastPosition();
  const { settings } = useSettings();
  const { getCustomTranslation, saveCustomTranslation, resetCustomTranslation } = useCustomTranslations();
  const { saveLastRead } = useLastRead();
  const { notes } = useNotes();
  
  const [isRendered, setIsRendered] = useState(false);
  const [menuVerse, setMenuVerse] = useState<number | null>(null);
  const [currentJuz, setCurrentJuz] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [editingVerse, setEditingVerse] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  // Draggable scroll handle
  const [scrollPercent, setScrollPercent] = useState(0);
  const [currentVerseNum, setCurrentVerseNum] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showVerseNum, setShowVerseNum] = useState(false);
  const [handleVisible, setHandleVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const verseNumTimeoutRef = useRef<NodeJS.Timeout>();
  const dragStartY = useRef(0);
  const dragStartScroll = useRef(0);
  
  const editingVerseObj = verses?.find(a => a.numberInSurah === editingVerse);
  const activeCustomTrans = editingVerse ? getCustomTranslation(surahNumber, editingVerse, settings.language) : null;
  const isSaveDisabled = !editingVerseObj || editText.trim() === '' || editText.trim() === (activeCustomTrans || editingVerseObj.translation).trim();
  const isResetDisabled = !activeCustomTrans;

  const menuRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Show handle briefly then auto-hide
  const showHandle = useCallback(() => {
    setHandleVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (!isDragging) setHandleVisible(false);
    }, 2000);
  }, [isDragging]);

  // Sync scroll % from window scroll
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? scrollTop / maxScroll : 0;
      setScrollPercent(pct);
      // Only show handle on regular scroll, not verse number
      setHandleVisible(true);
      if (!isDragging) {
        if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = setTimeout(() => setHandleVisible(false), 1500);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isDragging]);

  // Drag handlers
  const onDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    setHandleVisible(true);
    setShowVerseNum(true); // show verse number when drag starts
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (verseNumTimeoutRef.current) clearTimeout(verseNumTimeoutRef.current);
    dragStartY.current = clientY;
    dragStartScroll.current = window.scrollY;
  }, []);

  const onDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const deltaY = clientY - dragStartY.current;
    const trackHeight = Math.max(1, window.innerHeight - 56 - 24 - 80); // matches render: HEADER_H + GAP + hit area
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollDelta = (deltaY / trackHeight) * maxScroll;
    const newScroll = Math.max(0, Math.min(maxScroll, dragStartScroll.current + scrollDelta));
    window.scrollTo({ top: newScroll });
  }, [isDragging]);

  const onDragEnd = useCallback(() => {
    setIsDragging(false);
    // Keep verse number visible for 1.5s then collapse back to pill
    verseNumTimeoutRef.current = setTimeout(() => setShowVerseNum(false), 1500);
    // Hide handle after 2s
    hideTimeoutRef.current = setTimeout(() => setHandleVisible(false), 2000);
  }, []);

  // Mouse events
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => onDragMove(e.clientY);
    const onUp = () => onDragEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, onDragMove, onDragEnd]);

  // Touch events
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: TouchEvent) => { e.preventDefault(); onDragMove(e.touches[0].clientY); };
    const onEnd = () => onDragEnd();
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging, onDragMove, onDragEnd]);

  // Cleanup
  useEffect(() => () => { if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current); }, []);


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

    const headerOffset = 70; // 56px sticky header + 14px safety buffer
    let rafId: number | null = null;

    const scanVisibleVerse = () => {
      rafId = null;
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
          setCurrentVerseNum(topMostVerseNum);
          if (surahNumber) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
              saveLastRead(surahNumber, topMostVerseNum);
            }, 400); // 400ms debounce prevents scroll-restoration save-spam
          }
        }
      }
    };

    // rAF-throttled scroll handler: fires once per frame during fast scroll
    const handleScroll = () => {
      if (rafId !== null) return; // already queued for this frame
      rafId = requestAnimationFrame(scanVisibleVerse);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    scanVisibleVerse(); // run immediately on mount

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
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

  // Read header bottom live — always accurate, no stale state
  // h-14 header = 56px (Tailwind constant), no DOM measurement needed
  const HEADER_H = 56;
  const GAP = 18;     // clear gap below header border
  const HIT_HALF = 40; // half of 80px hit area height
  const trackH = window.innerHeight - HEADER_H + GAP - HIT_HALF * 2;
  const handleTop = (HEADER_H - GAP + HIT_HALF) + scrollPercent * Math.max(0, trackH);

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
          }} className="p-2 -ml-2 rounded-xl transition">
            <ArrowLeft size={20} />
          </button>
          {isLoading ? (
            null
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

      {/* Draggable Scroll Handle */}
      {isRendered && (
        <div
          ref={handleRef}
          onMouseDown={(e) => { e.preventDefault(); onDragStart(e.clientY); }}
          onTouchStart={(e) => { onDragStart(e.touches[0].clientY); }}
          style={{
            position: 'fixed',
            right: '0px',
            top: `${handleTop}px`,
            transform: 'translateY(-50%)',
            zIndex: 50,
            opacity: handleVisible || isDragging ? 1 : 0,
            transition: isDragging ? 'opacity 0.15s' : 'opacity 0.4s, top 0s',
            touchAction: 'none',
            userSelect: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            // Large invisible hit area — easy to tap even when pill is thin
            width: '48px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              width: showVerseNum ? '42px' : '6px',
              height: showVerseNum ? '42px' : '42px',
              borderRadius: '100px 0 0 100px',
              background: isDragging
                ? 'hsl(var(--primary))'
                : 'hsl(var(--primary) / 0.75)',
              boxShadow: isDragging
                ? '-4px 0 16px hsl(var(--primary) / 0.4)'
                : '-2px 0 8px hsl(var(--primary) / 0.2)',
              transition: 'width 0.25s cubic-bezier(0.34,1.56,0.64,1), background 0.2s, box-shadow 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                color: 'hsl(var(--primary-foreground))',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'var(--font-body, sans-serif)',
                letterSpacing: '-0.3px',
                lineHeight: 1,
                pointerEvents: 'none',
                opacity: showVerseNum ? 1 : 0,
                transition: 'opacity 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {currentVerseNum}
            </span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isLoading ? (
          null
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
            const tafsirExists = hasTafsir(surahNumber, verse.numberInSurah);
            const bookmarked = isBookmarked(surahNumber, verse.numberInSurah);
            const note = notes.find(n => n.surahNumber === surahNumber && n.verseNumber === verse.numberInSurah);
            const customTrans = getCustomTranslation(surahNumber, verse.numberInSurah, settings.language);
            const displayTranslation = customTrans || verse.translation;



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
                        className="p-1.5 rounded-lg transition"
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
                            className="flex items-center gap-2 w-full px-3 py-2 text-[15px] font-medium transition text-foreground/90"
                          >
                            <BookmarkIcon size={16} className="text-muted-foreground mr-1" />
                            {bookmarked ? 'Remove Bookmark' : 'Bookmark'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuVerse(null);
                              if (tafsirExists) {
                                navigate(`/tafsir-view?surah=${surahNumber}&verse=${verse.numberInSurah}`);
                              } else {
                                navigate(`/tafsir-builder?surah=${surahNumber}&verse=${verse.numberInSurah}`);
                              }
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-[15px] font-medium transition text-foreground/90"
                          >
                            <FileText size={16} className="text-muted-foreground mr-1" />
                            {tafsirExists ? 'View Tafsirs' : 'Add Tafsirs'}
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
                            className="flex items-center gap-2 w-full px-3 py-2 text-[15px] font-medium transition text-foreground/90"
                          >
                            <BookOpen size={16} className="text-muted-foreground mr-1" />
                            {explained ? 'View Explanation' : 'Add Explanation'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuVerse(null);
                              if (note) {
                                navigate(`/note-view?id=${note.id}`);
                              } else {
                                navigate(`/note-builder?surah=${surahNumber}&verse=${verse.numberInSurah}`);
                              }
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-[15px] font-medium transition text-foreground/90"
                          >
                            <PenLine size={16} className="text-muted-foreground mr-1" />
                            {note ? 'View Note' : 'Add Note'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditText(customTrans || verse.translation);
                              setEditingVerse(verse.numberInSurah);
                              setMenuVerse(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-[15px] font-medium transition text-foreground/90"
                          >
                            <Pencil size={16} className="text-muted-foreground mr-1" />
                            Edit Translation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arabic */}
                  {settings.showWordByWord ? (
                    <WordByWordVerse 
                      verse={verse} 
                      showTransliteration={settings.showWordTransliteration} 
                      onWordClick={(w) => setSelectedWord(w)}
                    />
                  ) : (
                    <p
                      className="arabic-text text-center text-foreground mb-4"
                      style={{
                        fontSize: `${settings.arabicFontSize}px`,
                        lineHeight: settings.lineSpacing
                      }}
                    >
                      <TajweedText text={verse.text} showColors={settings.showTajweed} waqf={verse.waqf} />
                    </p>
                  )}

                  {/* Full Verse Transliteration */}
                  {settings.showTransliteration && (
                    <p 
                      className="font-serif italic text-primary/60 text-center mb-3 leading-snug px-4"
                      style={{ fontSize: `${settings.translationFontSize - 1}px` }}
                    >
                      {verse.words?.filter(w => w.charTypeName !== 'end').map(w => w.transliteration).join(' ')}
                    </p>
                  )}

                  {/* Translation */}
                  <p
                    className="font-display text-muted-foreground text-center"
                    style={{
                      fontSize: `${settings.language === 'en' ? settings.translationFontSize + 2 : settings.translationFontSize}px`,
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
                  
                  <div className="px-7 pb-[max(1.25rem,env(safe-area-inset-bottom,1.25rem))] pt-4 bg-background border-t border-border shrink-0 flex gap-3">
                     <button 
                        disabled={isResetDisabled}
                        onClick={() => {
                           resetCustomTranslation(surahNumber, editingVerse, settings.language);
                           setEditingVerse(null);
                        }} 
                        className={`flex-1 font-medium py-[14px] rounded-full transition-colors text-[15px] ${isResetDisabled ? 'bg-secondary text-muted-foreground/80 cursor-not-allowed' : 'bg-destructive/10 text-destructive'}`}
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
                        className={`flex-[2] font-medium py-[14px] rounded-full transition-colors text-[15px] ${isSaveDisabled ? 'bg-secondary text-muted-foreground/80 cursor-not-allowed' : 'bg-primary text-primary-foreground'}`}
                     >
                        Save Translation
                     </button>
                  </div>
               </>
            )}
         </DrawerContent>
      </Drawer>
      
      <WordDetailDrawer 
        word={selectedWord} 
        onClose={() => setSelectedWord(null)}
      />
    </div>
  );
}
