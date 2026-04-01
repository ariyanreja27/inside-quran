import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, FileText, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useSurahs } from '@/hooks/useQuranData';
import { useFavorites } from '@/hooks/useAppStore';
import SurahCard from '@/components/SurahCard';
import SearchOverlay from '@/components/SearchOverlay';

type Filter = 'all' | 'Meccan' | 'Medinan';

export default function SurahListPage() {
  const navigate = useNavigate();
  const { data: surahs, isLoading } = useSurahs();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [filter, setFilter] = useState<Filter>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  return (
    <div className="min-h-screen pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md pb-2 pt-1 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-b border-border/60 transform-gpu">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-display text-xl font-semibold text-foreground">
            Inside Quran
          </h1>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-full text-foreground active:scale-95 transition-all outline-none"
                aria-label="Menu"
              >
                <Menu size={22} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-black/95 border-border shadow-xl animate-in fade-in-0 zoom-in-95">

              <DropdownMenuItem 
                onClick={() => navigate('/settings')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors"
              >
                <Settings size={18} />
                <span className="font-medium text-[13.5px]">Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                ease: [0.16, 1, 0.3, 1] // Custom quintic ease-out for ultra smoothness
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
    </div>
  );
}
