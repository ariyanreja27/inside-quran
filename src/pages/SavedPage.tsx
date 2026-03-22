import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { Star, BookmarkCheck, Highlighter, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites, useBookmarks } from '@/hooks/useAppStore';
import { useSurahs, useSurahVerses } from '@/hooks/useQuranData';

type SavedView = 'favorites' | 'bookmarks' | 'highlights';

function BookmarkedVerseCard({ surahNumber, verseNumber }: { surahNumber: number; verseNumber: number }) {
  const { data: surahs } = useSurahs();
  const { data: verses } = useSurahVerses(surahNumber);
  const surah = surahs?.find(s => s.number === surahNumber);
  const verse = verses?.find(a => a.numberInSurah === verseNumber);

  if (!surah || !verse) return null;

  return (
    <Link to={`/surah/${surahNumber}?verse=${verseNumber}`} className="block">
      <div className="surah-card">
        <div className="mb-2 flex items-center gap-2">
          <BookmarkCheck size={14} className="gold-accent" />
          <span className="text-xs font-medium text-foreground">{surah.name} : {verseNumber}</span>
        </div>
        <p className="arabic-text line-clamp-1 text-sm text-foreground">{verse.text}</p>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{verse.translation}</p>
      </div>
    </Link>
  );
}

export default function SavedPage() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();
  const { bookmarks } = useBookmarks();
  const { data: surahs } = useSurahs();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SavedView | null;
  const activeView = tabParam === 'favorites' || tabParam === 'bookmarks' || tabParam === 'highlights' ? tabParam : 'favorites';

  const setActiveView = (view: SavedView) => {
    setSearchParams({ tab: view }, { replace: true });
  };

  const favoriteSurahs = surahs?.filter(s => favorites.includes(s.number)) || [];
  const tabs: { id: SavedView; label: string }[] = [
    { id: 'favorites', label: 'Favorite' },
    { id: 'bookmarks', label: 'Bookmarked' },
    { id: 'highlights', label: 'Highlights' },
  ];

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      const idx = tabs.findIndex(t => t.id === activeView);
      if (idx !== -1 && idx < tabs.length - 1) setActiveView(tabs[idx + 1].id);
    },
    onSwipedRight: () => {
      const idx = tabs.findIndex(t => t.id === activeView);
      if (idx > 0) setActiveView(tabs[idx - 1].id);
    },
    trackMouse: true,
    preventScrollOnSwipe: true,
    delta: 40,
  });

  return (
    <div {...handlers} className="min-h-screen pb-24 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-2 pt-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border/60 transform-gpu">
        <div className="flex items-center gap-3 px-4 h-14">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-accent active:scale-95 text-foreground outline-none"
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-display text-xl font-semibold text-foreground flex-1">
            Saved
          </h1>
        </div>
      </div>

      <div className="px-4 mt-6">
        <div className="mb-5 rounded-full border border-border bg-secondary/40 p-1 backdrop-blur-sm relative">
          <div className="grid grid-cols-3 gap-1 relative">
            {tabs.map((tab) => {
              const active = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`relative rounded-full px-4 py-2.5 text-xs font-semibold transition-colors z-10 ${active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-primary'
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
          {activeView === 'favorites' && (
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
                <div className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {favoriteSurahs.map((surah) => (
                      <motion.div
                        key={surah.number}
                        layout
                        initial={{ opacity: 0, scale: 0.95, marginBottom: 12 }}
                        animate={{ opacity: 1, scale: 1, height: 'auto', marginBottom: 12 }}
                        exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <Link to={`/surah/${surah.number}`} className="block">
                          <div className="surah-card flex items-center gap-4">
                            {/* Surah number circle */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full border border-border flex items-center justify-center bg-muted/30">
                              <span className="text-xs font-mono text-muted-foreground tabular-nums">{surah.number}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-display text-sm font-semibold truncate">{surah.name}</p>
                              <p className="text-xs text-muted-foreground">{surah.verseCount} verses</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <p className="arabic-text font-arabic text-primary ml-1 mr-2">{surah.nameArabic}</p>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleFavorite(surah.number);
                                }}
                                className="p-2 -mr-2 text-primary hover:bg-accent rounded-full transition-colors outline-none"
                              >
                                <Star size={16} className="fill-primary" />
                              </button>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'bookmarks' && (
            <motion.div
              key="bookmarks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                <BookmarkCheck size={14} className="gold-accent" /> Bookmarked Verses
              </h2>
              {bookmarks.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">No bookmarked verses yet</p>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((bm, i) => (
                    <motion.div key={`${bm.surahNumber}-${bm.verseNumber}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <BookmarkedVerseCard surahNumber={bm.surahNumber} verseNumber={bm.verseNumber} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'highlights' && (
            <motion.div
              key="highlights"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                <Highlighter size={14} className="gold-accent" /> Highlights
              </h2>
              <p className="py-8 text-center text-xs text-muted-foreground">No highlights yet</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
