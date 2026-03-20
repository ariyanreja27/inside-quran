import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Menu, Plus, Settings } from 'lucide-react';
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
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <h1 className="font-display text-xl font-semibold text-foreground">
            Inside Quran
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-full text-foreground hover:bg-accent active:scale-95 transition-all outline-none"
                aria-label="Menu"
              >
                <Menu size={22} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl bg-white/95 backdrop-blur-sm dark:bg-black/95 border-border shadow-xl animate-in fade-in-0 zoom-in-95">
              <DropdownMenuItem 
                onClick={() => navigate('/explanation-builder')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors"
              >
                <Plus size={18} />
                <span className="font-medium text-[13.5px]">Add Explanation</span>
              </DropdownMenuItem>
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

      {/* Search Trigger */}
      <div className="px-4 mt-4">
        <div 
          onClick={() => setIsSearchOpen(true)}
          className="relative cursor-pointer group"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" size={18} />
          <div className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border border-border text-sm text-muted-foreground font-body group-hover:border-primary/30 transition-all">
            Search surahs, ayahs, or keywords...
          </div>
        </div>
      </div>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Filters */}
      <div className="flex gap-2 px-4 mt-4">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={filter === f.value ? 'filter-chip-active' : 'filter-chip'}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Surah List */}
      <div className="px-4 mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="surah-card animate-pulse h-16" />
          ))
        ) : (
          filtered.map(surah => (
            <SurahCard
              key={surah.number}
              surah={surah}
              isFavorite={isFavorite(surah.number)}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}
      </div>
    </div>
  );
}
