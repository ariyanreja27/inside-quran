import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, BookmarkCheck, Bookmark as BookmarkIcon, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSurahAyahs, useSurahs } from '@/hooks/useQuranData';
import { useBookmarks, useExplanations, useLastPosition } from '@/hooks/useAppStore';
import ExplanationSheet from '@/components/ExplanationSheet';
import type { Ayah } from '@/types/quran';

export default function SurahReadingPage() {
  const { number } = useParams<{ number: string }>();
  const surahNumber = parseInt(number || '1');
  const navigate = useNavigate();
  const { data: surahs } = useSurahs();
  const { data: ayahs, isLoading } = useSurahAyahs(surahNumber);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { hasExplanation, getExplanation } = useExplanations();
  const { setPosition } = useLastPosition();
  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);
  const [menuAyah, setMenuAyah] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const surah = surahs?.find(s => s.number === surahNumber);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [surahNumber]);

  useEffect(() => {
    if (surahNumber) {
      setPosition({ surahNumber, ayahNumber: 1 });
    }
  }, [surahNumber, setPosition]);

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
            <h2 className="font-display font-semibold text-sm truncate">{surah?.englishName}</h2>
            <p className="text-[10px] text-muted-foreground">{surah?.englishNameTranslation}</p>
          </div>
          <p className="arabic-text text-lg text-primary font-arabic">{surah?.name}</p>
        </div>
      </div>

      {/* Bismillah */}
      {surahNumber !== 1 && surahNumber !== 9 && (
        <div className="text-center py-8 px-4">
          <p className="bismillah-text text-2xl text-primary font-arabic leading-relaxed">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </p>
        </div>
      )}

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

            return (
              <div key={ayah.numberInSurah}>
                {dividers.length > 0 && (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <div className="h-px flex-1 bg-border" />
                    <span className="divider-label">{dividers.join(' • ')}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: Math.min(ayah.numberInSurah * 0.02, 1) }}
                  className={`relative cursor-pointer ${explained ? 'ayah-card-explained' : 'ayah-card'} ${
                    !explained ? 'opacity-90' : ''
                  }`}
                  onClick={() => setSelectedAyah(ayah)}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary text-xs font-semibold text-primary">
                        {ayah.numberInSurah}
                      </span>
                      {explained && (
                        <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          <FileText size={10} /> Explained
                        </span>
                      )}
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
                  <p className="arabic-text text-xl text-center leading-[2.5] text-foreground mb-4">
                    {ayah.text}
                  </p>

                  {/* Translation */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {ayah.translation}
                  </p>
                </motion.div>
              </div>
            );
          })
        )}
      </div>

      {/* Explanation Sheet */}
      {selectedAyah && surah && (
        <ExplanationSheet
          ayah={selectedAyah}
          surah={surah}
          onClose={() => setSelectedAyah(null)}
        />
      )}
    </div>
  );
}
