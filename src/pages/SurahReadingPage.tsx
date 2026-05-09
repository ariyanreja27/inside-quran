import React, { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MoreVertical, BookmarkCheck, Bookmark as BookmarkIcon, FileText, Pencil, BookOpen, PenLine, Settings as SettingsIcon, Type as TypeIcon, Globe, Book, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSurahVerses, useSurahs } from '@/hooks/useQuranData';
import { useBookmarks, useExplanations, useLastPosition, useLastRead, useSettings, useCustomTranslations, useCustomTafsirs, useNotes, useDarkMode } from '@/hooks/useAppStore';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { TajweedText } from '@/components/TajweedText';
import { WordByWordVerse } from '@/components/WordByWordVerse';
import { WordDetailDrawer } from '@/components/WordDetailDrawer';
import { SurahBanner } from '@/components/SurahBanner';
import { AyahMarker } from '@/components/AyahMarker';
import { PagePill } from '@/components/PagePill';
import type { Verse, Word } from '@/types/quran';

const arabicVerseNumber = (num: number) => {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(n => arabicNumbers[parseInt(n)]).join('');
};

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
  const surah = surahs?.find(s => s.number === surahNumber);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetVerse = queryParams.get('verse');
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { hasExplanation, getExplanation } = useExplanations();
  const { hasTafsir } = useCustomTafsirs();
  const { setPosition } = useLastPosition();
  const { settings, updateSettings } = useSettings();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { getCustomTranslation, saveCustomTranslation, resetCustomTranslation } = useCustomTranslations();
  const { saveLastRead } = useLastRead();
  const { notes } = useNotes();

  const [isRendered, setIsRendered] = useState(false);
  const [menuVerse, setMenuVerse] = useState<number | null>(null);
  const [currentJuz, setCurrentJuz] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [currentRuku, setCurrentRuku] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [renderLimit, setRenderLimit] = useState(30);


  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Tracking variables for Juz/Page/Ruku dividers
  let lastJuz = 0;
  let lastPage = 0;
  let lastRuku = 0;
  // Reset render limit when surah changes
  useEffect(() => { setRenderLimit(30); }, [surahNumber]);

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
          setCurrentRuku(verse.ruku);
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

  // After first 30 verses paint, load all remaining verses immediately during idle time
  useEffect(() => {
    if (!verses || !isRendered || renderLimit >= verses.length) return;
    const id = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback
      ? (window as Window & { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => number }).requestIdleCallback(
        () => setRenderLimit(verses.length),
        { timeout: 300 }
      )
      : setTimeout(() => setRenderLimit(verses.length), 100) as unknown as number;
    return () => {
      if ((window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(id as number);
      } else {
        clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
      }
    };
  }, [verses, isRendered, renderLimit]);

  // Read header bottom live — always accurate, no stale state
  // h-14 header = 56px (Tailwind constant), no DOM measurement needed
  const HEADER_H = 56;
  const GAP = 18;     // clear gap below header border
  const HIT_HALF = 40; // half of 80px hit area height
  const trackH = window.innerHeight - HEADER_H + GAP - HIT_HALF * 2;
  const handleTop = (HEADER_H - GAP + HIT_HALF) + scrollPercent * Math.max(0, trackH);
  // ── Tajweed word-click helpers ────────────────────────────────────────────
  // Split tajweed-encoded text by whitespace at bracket-depth 0
  const splitTajweedWords = (text: string): string[] => {
    const words: string[] = [];
    let current = '';
    let inBracket = false;
    for (const ch of text) {
      if (ch === '[') inBracket = true;
      else if (ch === ']') inBracket = false;
      // Split on any whitespace while outside brackets
      if (/\s/.test(ch) && !inBracket) {
        if (current.trim()) words.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) words.push(current.trim());
    return words;
  };

  // Strip [code[text]] or [code[text] markup → plain text, then nuke leftover brackets
  const stripTajweedMarkup = (str: string): string =>
    str
      .replace(/\[[a-z]+(?::\d+)?\[([^\]]+)\]\]/g, '$1') // [code:id[text]]  (two closings)
      .replace(/\[[a-z]+(?::\d+)?\[([^\]]+)\]/g, '$1')   // [code:id[text]   (one closing)
      .replace(/[[\]]/g, '');                              // purge any leftover brackets

  // Normalize for comparison: strip brackets then diacritics + alif variants
  const normAr = (str: string): string =>
    str
      .replace(/[[\]]/g, '')                                          // kill stray brackets
      .replace(/[\u064B-\u065F\u0610-\u061A\u0670\u06D6-\u06ED]/g, '') // diacritics
      .replace(/[\u0671\u0672\u0622\u0623\u0625]/g, '\u0627')                 // alif variants → ا
      .replace(/\uFE8E|\uFE8D/g, '\u0627')
      .trim();

  /**
   * Map each tajweed text segment to its corresponding verse.Word.
   * Uses greedy accumulation: collect segments until their stripped text
   * covers the next word's plain text, then advance to the next word.
   */
  const buildWordMap = (segments: string[], words: Word[] | undefined): (Word | null)[] => {
    const clickable = (words ?? []).filter(w => w.charTypeName !== 'end');
    if (!clickable.length || !segments.length) return segments.map(() => null);

    const result: (Word | null)[] = [];
    let wIdx = 0;
    let carry = '';

    for (let si = 0; si < segments.length; si++) {
      if (wIdx >= clickable.length) { result.push(null); continue; }

      const curr = clickable[wIdx];
      result.push(curr);

      carry += normAr(stripTajweedMarkup(segments[si]));
      const wordNorm = normAr(curr.text);
      const segsLeft = segments.length - si - 1;   // future segments
      const wordsLeft = clickable.length - wIdx - 1; // future words

      // Advance to next word when:
      //  (a) remaining segs ≤ remaining words → must be 1:1 from here on, OR
      //  (b) accumulated chars cover the current word AND we're not forced to keep combining
      const mustCombine = segsLeft > wordsLeft;
      const contentComplete = carry.length > 0 && carry.length >= wordNorm.length;

      if (segsLeft <= wordsLeft || (contentComplete && !mustCombine)) {
        wIdx++;
        carry = '';
      }
    }
    return result;
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header v6: Refined Navigation */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-2xl border-b border-border/40 transition-all duration-300">
        <div className="h-16 px-4 flex items-center justify-between gap-3">
          {/* Left: Back */}
          <div className="w-14">
            <button
              onClick={() => {
                if (window.history.state?.idx > 0) navigate(-1);
                else navigate('/');
              }}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-secondary/30 hover:bg-secondary transition-all active:scale-90"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          {/* Center: Title */}
          <div className="flex-1 text-center min-w-0">
            <motion.h1
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="font-display font-semibold text-lg sm:text-xl text-foreground truncate tracking-tight leading-tight"
            >
              {isLoading ? "..." : surah?.name}
            </motion.h1>
            {!isLoading && (
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] opacity-50 -mt-0.5">
                {surah?.meaning}
              </p>
            )}
          </div>

          {/* Right: Stylized Surah Number (No text prefix) */}
          <div className="w-14 flex justify-end">
            {!isLoading && (
              <div className="w-9 h-9 flex items-center justify-center rounded-full bg-primary/5 border border-primary/10 text-primary font-black text-xs shadow-sm">
                {surahNumber.toString().padStart(2, '0')}
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Floating Command Pill (v5) */}
      <AnimatePresence>
        {!isLoading && (
          <motion.div
            initial={{ y: 100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transform-gpu"
          >
            <div className="bg-card/80 backdrop-blur-xl border border-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-full p-1.5 flex items-center gap-1.5 min-w-[240px]">
              {/* Segmented Mode Switcher */}
              <div className="flex-1 flex items-center bg-secondary/40 rounded-full p-1 relative border border-border/20">
                <div
                  className="absolute rounded-full bg-card shadow-md inset-y-1 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{
                    width: 'calc(50% - 2px)',
                    left: settings.showWordByWord 
                        ? '4px' 
                        : 'calc(50% + 2px)',
                  }}
                />
                <button
                  onClick={() => updateSettings({ showWordByWord: true })}
                  className={`flex-1 relative z-10 py-2.5 text-[10px] font-black tracking-widest rounded-full transition-all ${settings.showWordByWord
                      ? 'text-primary'
                      : 'text-muted-foreground/50 hover:text-muted-foreground'
                    }`}
                >
                  WORD
                </button>
                <button
                  onClick={() => updateSettings({ showWordByWord: false })}
                  className={`flex-1 relative z-10 py-2.5 text-[10px] font-black tracking-widest rounded-full transition-all ${!settings.showWordByWord
                      ? 'text-primary'
                      : 'text-muted-foreground/50 hover:text-muted-foreground'
                    }`}
                >
                  VERSE
                </button>
              </div>

              {/* Settings Action */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-90 transition-all"
                title="Quick Settings"
              >
                <SettingsIcon size={20} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="w-full pb-12 pt-6"
          >
            {/* Bismillah & Surah Calligraphy */}
            <div className="text-center py-2 px-4 flex flex-col items-center gap-1">
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
              className="mt-2 px-4 space-y-3"
              ref={(el) => { if (el && !isRendered) setIsRendered(true); }}
            >
              {verses?.slice(0, renderLimit).map((verse) => {
                const anyChanged = verse.juz !== lastJuz || verse.page !== lastPage || verse.ruku !== lastRuku;
                if (anyChanged) {
                  lastJuz = verse.juz;
                  lastPage = verse.page;
                  lastRuku = verse.ruku;
                }
                const dividerLabel = anyChanged
                  ? `Juz ${verse.juz}  ·  Page ${verse.page}  ·  Ruku ${verse.ruku}`
                  : null;

                const explained = hasExplanation(surahNumber, verse.numberInSurah);
                const tafsirExists = hasTafsir(surahNumber, verse.numberInSurah);
                const bookmarked = isBookmarked(surahNumber, verse.numberInSurah);
                const note = notes.find(n => n.surahNumber === surahNumber && n.verseNumber === verse.numberInSurah);
                const customTrans = getCustomTranslation(surahNumber, verse.numberInSurah, settings.language);
                const displayTranslation = customTrans || verse.translation;

                return (
                  <Fragment key={verse.numberInSurah}>
                    {dividerLabel && (
                      <div className="sticky top-16 z-20 bg-background/90 backdrop-blur-md flex items-center justify-center gap-2 py-2 px-2 border-b border-border/10">
                        <div className="h-px flex-1 bg-border/20" />
                        <span className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground/60 uppercase whitespace-nowrap">
                          {dividerLabel}
                        </span>
                        <div className="h-px flex-1 bg-border/20" />
                      </div>
                    )}
                    <div
                      id={`verse-${verse.numberInSurah}`}
                      className="relative verse-card transition-all duration-300 rounded-2xl bg-card border border-border p-5"
                    >
                      {/* Top row */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span 
                            className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold"
                            style={{ backgroundColor: '#F1EFE9', color: '#7C3636' }}
                          >
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
                      {(() => {
                        let arabicText = verse.text || '';
                        // Strip Private Use Area characters
                        arabicText = arabicText.replace(/[\uE000-\uF8FF]/g, '');
                        // Fix dataset anomalies where single-letter prefixes (Waw, Fa, Ba, Ka, Li) are separated by spaces
                        arabicText = arabicText.replace(/(^|\s)([وفبكلساأ][\u064B-\u065F]*)\s+(?=\S)/g, (match, p1, p2) => p1 + p2);

                        const rawLocalWords = arabicText.split(/ +/);
                        const localWords: string[] = [];
                        for (const w of rawLocalWords) {
                          // If the word consists entirely of marks/numbers/waqf signs, append it to the previous word
                          // eslint-disable-next-line no-misleading-character-class
                          if (/^[\u0600-\u061C\u064B-\u065F\u0660-\u066D\u0670\u06D6-\u06ED\u06F0-\u06F9٪]+$/.test(w) && localWords.length > 0) {
                            localWords[localWords.length - 1] += ' ' + w;
                          } else {
                            localWords.push(w);
                          }
                        }

                        if (settings.showWordByWord) {
                          return (
                            <div 
                              className="flex flex-wrap justify-center gap-y-6 gap-x-1.5 w-full pt-4 pb-4"
                              style={{
                                fontSize: `${settings.arabicFontSize}px`,
                                lineHeight: settings.lineSpacing,
                                direction: 'rtl'
                              }}
                            >
                              {localWords.map((wordStr, index) => {
                                const wordData = verse.words?.[index];
                                const isEnd = wordData?.charTypeName === 'end' || /^[\u0660-\u06690-9]+$/.test(wordStr) || wordStr.includes('۝') || wordStr.includes('٪');
                                
                                return (
                                  <div 
                                    key={`${verse.numberInSurah}-${index}`} 
                                    className={`relative group inline-flex flex-col items-center cursor-pointer`}
                                    onClick={() => {
                                      if (!isEnd && wordData) {
                                        setSelectedWord({ ...wordData, text: wordStr });
                                      }
                                    }}
                                  >
                                     <span 
                                        className={`arabic-text transition-colors duration-200 ${
                                          !isEnd && wordData ? (
                                            isDark 
                                              ? 'group-hover:text-primary group-hover:bg-primary/20 rounded px-1' 
                                              : 'group-hover:text-primary group-hover:bg-primary/10 rounded px-1'
                                          ) : ''
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: wordStr }}
                                     />
                                     
                                     {/* Word By Word Data */}
                                     {!isEnd && wordData && (
                                        <div className="flex flex-col items-center mt-2 opacity-100 transition-opacity duration-200">
                                          {settings.showWordTransliteration && (
                                           <span className="text-[11px] text-primary/70 font-medium mb-0.5 font-sans whitespace-nowrap">{wordData.transliteration}</span>
                                          )}
                                           <span className="text-[12px] text-muted-foreground font-sans text-center max-w-[80px] leading-tight">{wordData.translation}</span>
                                        </div>
                                     )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        // Standard Mode (No Word by Word Layout, just inline spans for perfect Arabic kerning)
                        return (
                          <div 
                            className="text-center w-full pt-4 pb-4 arabic-text"
                            style={{
                              fontSize: `${settings.arabicFontSize}px`,
                              lineHeight: settings.lineSpacing,
                              direction: 'rtl'
                            }}
                          >
                            {localWords.map((wordStr, index) => {
                              const wordData = verse.words?.[index];
                              const isEnd = wordData?.charTypeName === 'end' || /^[\u0660-\u06690-9]+$/.test(wordStr) || wordStr.includes('۝') || wordStr.includes('٪');
                              
                              return (
                                <span 
                                  key={`${verse.numberInSurah}-${index}`} 
                                  className={`relative group inline-block cursor-pointer`}
                                  onClick={() => {
                                    if (!isEnd && wordData) {
                                      setSelectedWord({ ...wordData, text: wordStr });
                                    }
                                  }}
                                >
                                   <span 
                                      className={`transition-colors duration-200 ${
                                        !isEnd && wordData ? (
                                          isDark 
                                            ? 'group-hover:text-primary group-hover:bg-primary/20 rounded px-1' 
                                            : 'group-hover:text-primary group-hover:bg-primary/10 rounded px-1'
                                        ) : ''
                                      }`}
                                      dangerouslySetInnerHTML={{ __html: wordStr }}
                                   />{' '}
                                   
                                   {/* Hover tooltip for translation only in standard mode */}
                                   {!isEnd && wordData && (
                                      <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10 ${
                                        isDark 
                                          ? 'bg-secondary text-foreground shadow-lg border border-border' 
                                          : 'bg-primary text-primary-foreground shadow-xl'
                                      }`}>
                                         {wordData.translation}
                                         {/* Little triangle pointer */}
                                         <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${
                                           isDark ? 'bg-secondary border-b border-r border-border' : 'bg-primary'
                                         }`} />
                                      </div>
                                   )}
                                </span>
                              );
                            })}
                          </div>
                        );
                      })()}

                      {/* Full Verse Transliteration */}
                      {settings.showTransliteration && (
                        <p
                          className="font-serif italic text-primary/60 text-center mb-3 leading-snug px-4"
                          style={{ fontSize: `${settings.translationFontSize - 1}px` }}
                        >
                          {verse.transliteration}
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
                    </div>
                  </Fragment>
                );
              })}
              {/* Load-more sentinel */}
              {verses && renderLimit < verses.length && (
                <div ref={loadMoreRef} className="h-16 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                </div>
              )}
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

      {/* Quick Settings Drawer */}
      <Drawer open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DrawerContent className="rounded-t-[2rem] bg-card border-none focus:outline-none flex flex-col max-h-[85vh] overflow-hidden">
          <div className="mx-auto w-12 h-1.5 bg-secondary/50 rounded-full mt-3 mb-2 shrink-0" />

          <div className="flex-1 overflow-y-auto px-6 pt-2 pb-8 scrollbar-hide">
            <DrawerTitle className="font-display text-xl font-bold mb-1 text-foreground">Quick Settings</DrawerTitle>
            <DrawerDescription className="text-[13px] text-muted-foreground mb-6">Customize your reading experience</DrawerDescription>

            <div className="space-y-6">
              {/* SECTION: TEXT SIZES */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <TypeIcon size={16} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Typography</h3>
                </div>

                <div className="grid gap-3">
                  {/* Arabic Size */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[13px] font-semibold">Arabic Size</span>
                      <span className="text-[13px] font-bold text-primary">{settings.arabicFontSize}px</span>
                    </div>
                    <Slider
                      value={[settings.arabicFontSize]}
                      min={20} max={60} step={2}
                      onValueChange={([val]) => updateSettings({ arabicFontSize: val })}
                    />
                  </div>

                  {/* Translation Size */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[13px] font-semibold">Translation Size</span>
                      <span className="text-[13px] font-bold text-primary">{settings.translationFontSize}px</span>
                    </div>
                    <Slider
                      value={[settings.translationFontSize]}
                      min={12} max={24} step={1}
                      onValueChange={([val]) => updateSettings({ translationFontSize: val })}
                    />
                  </div>

                  {/* Line Spacing */}
                  <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[13px] font-semibold">Line Spacing</span>
                      <span className="text-[13px] font-bold text-primary">{settings.lineSpacing.toFixed(1)}x</span>
                    </div>
                    <Slider
                      value={[settings.lineSpacing]}
                      min={1.5} max={4.0} step={0.1}
                      onValueChange={([val]) => updateSettings({ lineSpacing: val })}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: DISPLAY */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Eye size={16} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Display</h3>
                </div>

                <div className="grid gap-2">
                  {[
                    {
                      id: 'tajweed',
                      label: 'Tajweed Colors',
                      icon: Book,
                      value: settings.showTajweed,
                      onChange: () => updateSettings({ showTajweed: !settings.showTajweed })
                    },
                    {
                      id: 'translit',
                      label: 'Transliteration',
                      icon: Globe,
                      value: settings.showTransliteration,
                      onChange: () => updateSettings({ showTransliteration: !settings.showTransliteration })
                    },
                    ...(settings.showWordByWord ? [{
                      id: 'word-translit',
                      label: 'Word Transliteration',
                      icon: TypeIcon,
                      value: settings.showWordTransliteration,
                      onChange: () => updateSettings({ showWordTransliteration: !settings.showWordTransliteration })
                    }] : [])
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={item.onChange}
                      className={`flex items-center justify-between p-3.5 rounded-2xl transition-all border ${item.value ? 'bg-primary/5 border-primary/20' : 'bg-secondary/20 border-border/50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={item.value ? 'text-primary' : 'text-muted-foreground'} />
                        <span className={`text-[14px] font-semibold ${item.value ? 'text-foreground' : 'text-muted-foreground'}`}>{item.label}</span>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors relative ${item.value ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${item.value ? 'translate-x-4' : 'translate-x-0'}`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsSettingsOpen(false);
                  navigate('/settings');
                }}
                className="w-full py-4 rounded-2xl bg-secondary/50 text-foreground font-bold text-sm hover:bg-secondary transition-colors"
              >
                View All Settings
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <WordDetailDrawer
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
      />
    </div>
  );
}
