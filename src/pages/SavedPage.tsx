import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { Star, BookmarkCheck, Highlighter, ArrowLeft, MoreHorizontal, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites, useBookmarks } from '@/hooks/useAppStore';
import { useSurahs, useSurahVerses } from '@/hooks/useQuranData';
import { useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SavedView = 'favorites' | 'bookmarks' | 'highlights';

function BookmarkedVerseCard({ surahNumber, verseNumber, onRemove }: { surahNumber: number; verseNumber: number; onRemove: (s: number, v: number) => void }) {
  const { data: surahs } = useSurahs();
  const { data: verses } = useSurahVerses(surahNumber);
  const surah = surahs?.find(s => s.number === surahNumber);
  const verse = verses?.find(a => a.numberInSurah === verseNumber);
  const navigate = useNavigate();
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  if (!surah || !verse) return null;

  return (
    <div className="relative group">
      <div 
        onClick={() => navigate(`/surah/${surahNumber}?verse=${verseNumber}`)}
        className="surah-card block cursor-pointer pr-12 transition-transform origin-left"
      >
        <div className="mb-2 flex items-center gap-2">
          <BookmarkCheck size={14} className="gold-accent" />
          <span className="text-xs font-medium text-foreground">{surah.name} : {verseNumber}</span>
        </div>
        <p className="arabic-text truncate leading-loose py-1 text-sm text-foreground">{verse.text}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{verse.translation}</p>
      </div>

      <div className="absolute right-3 top-3 z-10">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-2 -mr-2 rounded-lg transition-colors text-muted-foreground outline-none"
            >
              <MoreHorizontal size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 p-1.5 rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-black/95 border-border shadow-xl animate-in fade-in-0 zoom-in-95">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setIsRemoveOpen(true);
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-destructive focus:bg-destructive/10 transition-colors outline-none"
            >
              <Trash2 size={16} />
              <span className="font-medium text-[13.5px]">Remove</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
        <AlertDialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-left text-lg font-bold">Remove Bookmark?</AlertDialogTitle>
            <AlertDialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
              Are you sure you want to remove the bookmark for <strong>{surah.name} : {verseNumber}</strong>? It will no longer appear in your saved list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-4">
            <AlertDialogCancel className="h-10 px-6 rounded-full border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { onRemove(surahNumber, verseNumber); setIsRemoveOpen(false); }}
              className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SavedPage() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();
  const { bookmarks, toggleBookmark } = useBookmarks();
  const { data: surahs } = useSurahs();
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as SavedView | null;
  const activeView = tabParam === 'favorites' || tabParam === 'bookmarks' || tabParam === 'highlights' ? tabParam : 'favorites';

  const [favoriteToRemove, setFavoriteToRemove] = useState<number | null>(null);

  const setActiveView = (view: SavedView) => {
    setSearchParams({ tab: view }, { replace: true });
  };

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [activeView]);

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
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all text-foreground outline-none"
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
                  className={`relative rounded-full px-4 py-2.5 text-xs font-semibold transition-colors z-10 ${active ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                >
                  {active && (
                    <motion.div
                      layoutId="savedTabIndicator"
                      className="absolute inset-0 bg-primary rounded-full shadow-sm z-[-1]"
                      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            null
          ) : activeView === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-muted-foreground/80">
                <Star size={14} className="gold-accent" /> Favorite Surahs
              </h2>
              {favoriteSurahs.length === 0 ? (
                <p className="py-20 text-center text-[13px] text-muted-foreground opacity-60">No favorite surahs yet</p>
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
                                  setFavoriteToRemove(surah.number);
                                }}
                                className="p-2 -mr-2 text-primary rounded-full transition-colors outline-none"
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

          <AlertDialog open={!!favoriteToRemove} onOpenChange={(open) => !open && setFavoriteToRemove(null)}>
            <AlertDialogContent className="w-[92vw] max-w-[360px] rounded-[2rem] border-none bg-white dark:bg-background shadow-2xl p-6">
              <AlertDialogHeader className="space-y-2">
                <AlertDialogTitle className="text-left text-lg font-bold">Remove Favorite?</AlertDialogTitle>
                <AlertDialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                  Are you sure you want to remove <strong>{surahs?.find(s => s.number === favoriteToRemove)?.name}</strong> from your favorite Surahs?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex flex-row justify-end gap-2 mt-4">
                <AlertDialogCancel className="h-10 px-6 rounded-full border-border bg-secondary/10 text-foreground text-[13px] font-medium hover:bg-secondary/20 transition-all">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => { if (favoriteToRemove) toggleFavorite(favoriteToRemove); setFavoriteToRemove(null); }}
                  className="h-10 px-6 rounded-full bg-destructive text-destructive-foreground text-[13px] font-bold hover:bg-destructive/90 transition-all"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {!loading && activeView === 'bookmarks' && (
            <motion.div
              key="bookmarks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-muted-foreground/80">
                <BookmarkCheck size={14} className="gold-accent" /> Bookmarked Verses
              </h2>
              {bookmarks.length === 0 ? (
                <p className="py-20 text-center text-[13px] text-muted-foreground opacity-60">No bookmarked verses yet</p>
              ) : (
                <div className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {bookmarks.map((bm) => {
                      const vNumber = bm.verseNumber || (bm as unknown as Record<string, number>).ayahNumber;
                      return (
                        <motion.div 
                          layout
                          key={`${bm.surahNumber}-${vNumber}`} 
                          initial={{ opacity: 0, scale: 0.95, marginBottom: 8 }} 
                          animate={{ opacity: 1, scale: 1, height: 'auto', marginBottom: 8 }} 
                          exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }} 
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <BookmarkedVerseCard 
                            surahNumber={bm.surahNumber} 
                            verseNumber={vNumber}
                            onRemove={toggleBookmark}
                          />
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {!loading && activeView === 'highlights' && (
            <motion.div
              key="highlights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-muted-foreground/80">
                <Highlighter size={14} className="gold-accent" /> Highlights
              </h2>
              <p className="py-20 text-center text-[13px] text-muted-foreground opacity-60">No highlights yet</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
