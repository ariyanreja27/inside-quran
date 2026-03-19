import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useSurahs } from '@/hooks/useQuranData';
import { useFavorites } from '@/hooks/useAppStore';
import SurahCard from '@/components/SurahCard';

type Filter = 'all' | 'Meccan' | 'Medinan';

export default function SurahListPage() {
  const { data: surahs, isLoading } = useSurahs();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (!surahs) return [];
    return surahs.filter(s => {
      const matchesSearch = !search ||
        s.englishName.toLowerCase().includes(search.toLowerCase()) ||
        s.englishNameTranslation.toLowerCase().includes(search.toLowerCase()) ||
        s.name.includes(search) ||
        s.number.toString() === search;
      const matchesFilter = filter === 'all' || s.revelationType === filter;
      return matchesSearch && matchesFilter;
    });
  }, [surahs, search, filter]);

  const filters: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Makkan', value: 'Meccan' },
    { label: 'Madani', value: 'Medinan' },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="islamic-pattern-bg px-4 pt-12 pb-6">
        <h1 className="font-display text-2xl font-bold text-foreground text-center">
          Inside Quran
        </h1>
        <p className="text-center text-muted-foreground text-sm mt-1">
          Your personal study notebook
        </p>
      </div>

      {/* Search */}
      <div className="px-4 -mt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search surahs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-card border border-border text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition"
          />
        </div>
      </div>

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
      <div className="px-4 mt-4 space-y-2">
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
