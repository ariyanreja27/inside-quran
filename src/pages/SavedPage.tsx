import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, BookmarkCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites, useBookmarks } from '@/hooks/useAppStore';
import { useSurahs, useSurahAyahs } from '@/hooks/useQuranData';

type SavedView = 'favorites' | 'bookmarks';

function BookmarkedAyahCard({ surahNumber, ayahNumber }: { surahNumber: number; ayahNumber: number }) {
  const { data: surahs } = useSurahs();
  const { data: ayahs } = useSurahAyahs(surahNumber);
  const surah = surahs?.find(s => s.number === surahNumber);
  const ayah = ayahs?.find(a => a.numberInSurah === ayahNumber);

  if (!surah || !ayah) return null;

  return (
    <Link to={`/surah/${surahNumber}`} className="block">
      <div className="surah-card">
        <div className="mb-2 flex items-center gap-2">
          <BookmarkCheck size={14} className="gold-accent" />
          <span className="text-xs font-medium text-foreground">{surah.name} : {ayahNumber}</span>
        </div>
        <p className="arabic-text line-clamp-1 text-sm text-foreground">{ayah.text}</p>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{ayah.translation}</p>
      </div>
    </Link>
  );
}

export default function SavedPage() {
  const { favorites } = useFavorites();
  const { bookmarks } = useBookmarks();
  const { data: surahs } = useSurahs();
  const [activeView, setActiveView] = useState<SavedView>('favorites');

  const favoriteSurahs = surahs?.filter(s => favorites.includes(s.number)) || [];
  const tabs: { id: SavedView; label: string }[] = [
    { id: 'favorites', label: 'Favorite Surahs' },
    { id: 'bookmarks', label: 'Bookmarked Ayahs' },
  ];

  return (
    <div className="min-h-screen pb-24">
      <div className="px-4 pb-5 pt-12">
        <h1 className="font-display text-2xl font-bold text-foreground">Saved</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your favorites and bookmarks</p>
      </div>

      <div className="px-4">
        <div className="mb-5 rounded-full border border-border bg-secondary/40 p-1 backdrop-blur-sm relative">
          <div className="grid grid-cols-2 gap-1 relative">
            {tabs.map((tab) => {
              const active = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`relative rounded-full px-4 py-2.5 text-xs font-semibold transition-colors z-10 ${
                    active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab-saved"
                      className="absolute inset-0 bg-primary rounded-full shadow-sm z-[-1]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeView === 'favorites' ? (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                <Star size={14} className="gold-accent" /> Favorite Surahs
              </h2>
              {favoriteSurahs.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No favorite surahs yet</p>
              ) : (
                <div className="space-y-2">
                  {favoriteSurahs.map((surah, i) => (
                    <motion.div key={surah.number} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <Link to={`/surah/${surah.number}`} className="block">
                        <div className="surah-card flex items-center justify-between">
                          <div>
                            <p className="font-display text-sm font-semibold">{surah.name}</p>
                            <p className="text-xs text-muted-foreground">{surah.ayahCount} ayahs</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="arabic-text font-arabic text-primary">{surah.nameArabic}</p>
                            <ArrowRight size={14} className="text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="bookmarks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                <BookmarkCheck size={14} className="gold-accent" /> Bookmarked Ayahs
              </h2>
              {bookmarks.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No bookmarked ayahs yet</p>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((bm, i) => (
                    <motion.div key={`${bm.surahNumber}-${bm.ayahNumber}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <BookmarkedAyahCard surahNumber={bm.surahNumber} ayahNumber={bm.ayahNumber} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
