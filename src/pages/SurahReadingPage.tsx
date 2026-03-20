import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MoreVertical, BookmarkCheck, Bookmark as BookmarkIcon, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSurahAyahs, useSurahs } from '@/hooks/useQuranData';
import { useBookmarks, useExplanations, useLastPosition, useSettings } from '@/hooks/useAppStore';
import type { Ayah } from '@/types/quran';

export default function SurahReadingPage() {
  const { number } = useParams<{ number: string }>();
  const surahNumber = parseInt(number || '1');
  const navigate = useNavigate();
  const { data: surahs } = useSurahs();
  const { data: ayahs, isLoading } = useSurahAyahs(surahNumber);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetAyah = queryParams.get('ayah');
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { hasExplanation, getExplanation } = useExplanations();
  const { setPosition } = useLastPosition();
  const { settings } = useSettings();
  const [menuAyah, setMenuAyah] = useState<number | null>(null);
  const [currentJuz, setCurrentJuz] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const surah = surahs?.find(s => s.number === surahNumber);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [surahNumber]);

  useEffect(() => {
    if (surahNumber && !targetAyah) {
      setPosition({ surahNumber, ayahNumber: 1 });
    } else if (surahNumber && targetAyah) {
      setPosition({ surahNumber, ayahNumber: parseInt(targetAyah) });
    }
  }, [surahNumber, targetAyah, setPosition]);

  useEffect(() => {
    if (ayahs && ayahs.length > 0 && !currentJuz) {
      setCurrentJuz(ayahs[0].juz);
      setCurrentPage(ayahs[0].page);
    }
  }, [ayahs, currentJuz]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries.find(entry => entry.isIntersecting);
        if (visibleEntry) {
          const ayahId = visibleEntry.target.id;
          const ayahNum = parseInt(ayahId.split('-')[1]);
          const ayah = ayahs?.find(a => a.numberInSurah === ayahNum);
          if (ayah) {
            setCurrentJuz(ayah.juz);
            setCurrentPage(ayah.page);
          }
        }
      },
      { threshold: 0.1, rootMargin: '-60px 0px -80% 0px' }
    );

    const ayahElements = document.querySelectorAll('[id^="ayah-"]');
    ayahElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [ayahs, isLoading]);

  // Scroll to target ayah if provided in URL
  useEffect(() => {
    if (!isLoading && targetAyah && ayahs) {
      const element = document.getElementById(`ayah-${targetAyah}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight effect
          element.classList.add('ring-2', 'ring-primary/50', 'bg-primary/5');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary/50', 'bg-primary/5');
          }, 2000);
        }, 300);
      }
    }
  }, [isLoading, targetAyah, ayahs]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuAyah(null);
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
          <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-xl hover:bg-secondary transition">
            <ArrowLeft size={20} />
          </button>
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
        </div>
      </div>

      {/* Bismillah & Surah Calligraphy */}
      <div className="text-center py-5 px-4 flex flex-col items-center gap-1">
        <p className="surah-calligraphy">
          surah{surahNumber.toString().padStart(3, '0')} surah-icon
        </p>
        {surahNumber !== 1 && surahNumber !== 9 && (
          <p className="bismillah-text text-3xl leading-normal">
            ﷽
          </p>
        )}
      </div>

      {/* Ayahs */}
      <div className="px-4 space-y-3 mt-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="ayah-card animate-pulse h-32" />
          ))
        ) : (
          ayahs?.map((ayah) => {
            const dividers: string[] = [];
            if (ayah.juz !== lastJuz) { dividers.push(`Juz ${ayah.juz}`); lastJuz = ayah.juz; }
            if (ayah.page !== lastPage) { dividers.push(`Page ${ayah.page}`); lastPage = ayah.page; }
            if (ayah.ruku !== lastRuku) { dividers.push(`Ruku ${ayah.ruku}`); lastRuku = ayah.ruku; }

            const explained = hasExplanation(surahNumber, ayah.numberInSurah);
            const bookmarked = isBookmarked(surahNumber, ayah.numberInSurah);

            if (settings.showOnlyExplained && !explained) return null;

            return (
              <div key={ayah.numberInSurah}>
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
                  transition={{ duration: 0.15, delay: Math.min(ayah.numberInSurah * 0.02, 1) }}
                  id={`ayah-${ayah.numberInSurah}`}
                  className="relative cursor-pointer ayah-card transition-all duration-500 rounded-2xl"
                  onClick={() => {
                    if (explained) {
                      navigate(`/explanation-view?surah=${surahNumber}&ayah=${ayah.numberInSurah}`);
                    } else {
                      navigate(`/explanation-builder?surah=${surahNumber}&ayah=${ayah.numberInSurah}`);
                    }
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-xs font-semibold text-primary">
                        {ayah.numberInSurah}
                      </span>
                      {bookmarked && (
                        <BookmarkCheck size={14} className="text-gold" />
                      )}
                    </div>
                    <div className="relative" ref={menuAyah === ayah.numberInSurah ? menuRef : undefined}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAyah(menuAyah === ayah.numberInSurah ? null : ayah.numberInSurah);
                        }}
                        className="p-1.5 rounded-lg hover:bg-secondary transition"
                      >
                        <MoreVertical size={16} className="text-muted-foreground" />
                      </button>
                      {menuAyah === ayah.numberInSurah && (
                        <div className="absolute right-0 top-8 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(surahNumber, ayah.numberInSurah);
                              setMenuAyah(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-secondary transition"
                          >
                            <BookmarkIcon size={14} />
                            {bookmarked ? 'Remove Bookmark' : 'Bookmark'}
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
                    {ayah.text}
                  </p>

                  {/* Translation */}
                  <p 
                    className={`font-display text-muted-foreground ${settings.language === 'ur' ? 'font-arabic' : ''}`} 
                    style={{ 
                      fontSize: `${settings.translationFontSize}px`,
                      lineHeight: 1.6,
                      direction: settings.language === 'ur' ? 'rtl' : 'ltr',
                      fontVariationSettings: settings.language === 'ur' ? 'none' : "'SOFT' 50, 'WONK' 0" 
                    }}
                  >
                    {ayah.translation}
                  </p>
                </motion.div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
