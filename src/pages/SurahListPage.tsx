import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  History, 
  LifeBuoy, 
  Settings, 
  Compass, 
  Library, 
  Bookmark, 
  Home, 
  BookOpen,
  Info,
  ExternalLink,
  Github
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useSurahs } from '@/hooks/useQuranData';
import { useFavorites, useLastRead } from '@/hooks/useAppStore';
import SurahCard from '@/components/SurahCard';
import SearchOverlay from '@/components/SearchOverlay';

type Filter = 'all' | 'Meccan' | 'Medinan';

export default function SurahListPage() {
  const navigate = useNavigate();
  const { data: surahs, isLoading } = useSurahs();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { lastRead } = useLastRead();
  const [filter, setFilter] = useState<Filter>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const recentRead = lastRead.length > 0 ? lastRead[0] : null;
  const [showPopup, setShowPopup] = useState(!!recentRead);

  // Hide popup on scroll or timeout
  useEffect(() => {
    if (!showPopup) return;
    const timer = setTimeout(() => setShowPopup(false), 5000); // 5 sec timeout

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setShowPopup(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showPopup]);

  const filtered = useMemo(() => {
    if (!surahs) return [];
    return surahs.filter(s => {
      const matchesFilter = filter === 'all' || s.type === filter;
      return matchesFilter;
    });
  }, [surahs, filter]);

  const filters: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Makkan', value: 'Meccan' },
    { label: 'Madani', value: 'Medinan' },
  ];

  const sidebarLinks = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Saved Explanations', icon: Bookmark, path: '/saved' },
    { label: 'Explore Themes', icon: Compass, path: '/explore' },
    { label: 'Library', icon: Library, path: '/library' },
  ];

  const secondaryLinks = [
    { label: 'Last Read', icon: History, path: '/last-read' },
    { label: 'Tajweed Guide', icon: BookOpen, path: '/tajweed-guide' },
    { label: 'Settings', icon: Settings, path: '/settings' },
    { label: 'Help & Support', icon: LifeBuoy, path: '/help' },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-2 pt-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border/60 transform-gpu">
        {/* Header */}
        <div className="flex items-center justify-between px-3 h-14">
          <div className="flex items-center gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-full text-foreground transition-all outline-none hover:bg-muted/50"
                  aria-label="Menu"
                >
                  <Menu size={22} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 border-none w-[280px] bg-background">
                <div className="flex flex-col h-full bg-background">
                  {/* Sidebar Header */}
                  <div className="p-6 pb-2">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                        <Bookmark size={22} fill="currentColor" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold tracking-tight">Inside Quran</h2>
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest opacity-70">Deep Study Tool</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {sidebarLinks.map((link) => (
                        <SheetClose asChild key={link.path}>
                          <button
                            onClick={() => navigate(link.path)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl font-medium text-[14px] hover:bg-primary/5 hover:text-primary transition-all group"
                          >
                            <link.icon size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                            {link.label}
                          </button>
                        </SheetClose>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-border/40 mx-6 my-4" />

                  {/* Secondary Links */}
                  <div className="px-6 space-y-1 overflow-y-auto flex-1">
                    <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-tighter opacity-50">Discovery & Support</p>
                    {secondaryLinks.map((link) => (
                      <SheetClose asChild key={link.path}>
                        <button
                          onClick={() => navigate(link.path)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
                        >
                          <link.icon size={18} />
                          {link.label}
                        </button>
                      </SheetClose>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="p-6 mt-auto">
                    <div className="bg-muted/30 rounded-3xl p-4 space-y-3">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-muted-foreground font-medium italic">Project version</span>
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold text-[10px]">v1.0.4</span>
                      </div>
                      <div className="flex gap-2 pt-1">
                         <button className="flex-1 flex items-center justify-center h-10 rounded-2xl bg-background border border-border/60 hover:border-primary/30 transition-all">
                             <Github size={18} className="text-foreground" />
                         </button>
                         <button className="flex-1 flex items-center justify-center h-10 rounded-2xl bg-background border border-border/60 hover:border-primary/30 transition-all">
                             <Info size={18} className="text-foreground" />
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="font-display text-xl font-semibold text-foreground pt-0.5 ml-1">
              Inside Quran
            </h1>
          </div>

          <button 
            onClick={() => navigate('/last-read')}
            className="w-10 h-10 flex items-center justify-center rounded-full text-foreground hover:bg-muted/50 transition-all outline-none"
            aria-label="History"
          >
            <History size={22} />
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="pb-4 pt-3 mb-2">
        {/* Search Trigger */}
        <div className="px-4">
          <div 
            onClick={() => setIsSearchOpen(true)}
            className="relative cursor-pointer group"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors" size={18} />
            <div className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border border-border text-sm text-muted-foreground font-body transition-all">
              Search Surahs, Verses, or Keywords
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 px-4 mt-4 relative isolate">
          {filters.map(f => {
            const isActive = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`relative px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors outline-none ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/40 text-foreground/70'
                }`}
              >
                <span className="relative z-10">{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Surah List */}
      <div className="px-4 mt-4 space-y-3">
        <AnimatePresence mode="wait">
          {!isLoading && (
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="space-y-3"
            >
              {filtered.map(surah => (
                <SurahCard
                  key={surah.number}
                  surah={surah}
                  isFavorite={isFavorite(surah.number)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Continue Reading Popup */}
      <AnimatePresence>
        {showPopup && recentRead && (
          <motion.div
            initial={{ opacity: 0, y: 30, x: "-50%", scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
            exit={{ opacity: 0, y: 10, x: "-50%", scale: 0.95 }}
            transition={{ duration: 0.3, delay:0.2, ease: 'easeOut' }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-background/95 backdrop-blur-md text-primary font-bold px-6 py-2 rounded-full border border-primary/20 shadow-[0_8px_30px_rgba(0,0,0,0.12)] cursor-pointer flex items-center gap-2 hover:bg-background/100 transition-colors"
            onClick={() => navigate(`/surah/${recentRead.surahNumber}?verse=${recentRead.verseNumber}`)}
          >
            <span className="text-[13.5px] tracking-tight whitespace-nowrap pt-0.5">Continue Reading</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
