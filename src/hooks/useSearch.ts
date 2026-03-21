import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSettings } from './useAppStore';
import { useLocalStorage } from './useLocalStorage';
import { surahList } from '@/data/quranMeta';

const API_BASE = 'https://api.alquran.cloud/v1';

export interface SearchResult {
  verseNumber: number;
  verseNumberInSurah: number;
  surahNumber: number;
  surahName: string;
  text: string;
  translation: string;
}

export type QueryInfo = 
  | { type: 'empty' }
  | { type: 'coordinate'; surah: number; verse: number }
  | { type: 'surah_number'; number: number }
  | { type: 'text'; text: string };

export function parseQueryString(input: string): QueryInfo {
  const trimmed = input.trim();
  if (!trimmed) return { type: 'empty' };

  // Coordinate search (e.g., "2:255")
  const coordMatch = trimmed.match(/^(\d+):(\d+)$/);
  if (coordMatch) {
    return { 
      type: 'coordinate', 
      surah: parseInt(coordMatch[1]), 
      verse: parseInt(coordMatch[2]) 
    };
  }

  // Surah number search (e.g., "114")
  const numberMatch = trimmed.match(/^\d+$/);
  if (numberMatch) {
    const num = parseInt(numberMatch[0]);
    if (num >= 1 && num <= 114) {
      return { type: 'surah_number', number: num };
    }
  }

  return { type: 'text', text: trimmed };
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { settings } = useSettings();
  const navigate = useNavigate();

  // Debounce logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Parse query type reactively for UI
  const queryInfo = useMemo(() => parseQueryString(debouncedQuery), [debouncedQuery]);

  // Keyword search query
  const { data: results, isLoading, error } = useQuery<SearchResult[]>({
    queryKey: ['search', debouncedQuery, settings.language],
    queryFn: async () => {
      if (queryInfo.type !== 'text') return [];

      const isArabic = /[\u0600-\u06FF]/.test(queryInfo.text);
      
      const edition = isArabic ? 'quran-uthmani' : 
        settings.language === 'bn' ? 'bn.bengali' : 
        settings.language === 'hi' ? 'hi.hindi' : 
        'en.sahih';

      const response = await fetch(`${API_BASE}/search/${queryInfo.text}/all/${edition}`);
      const data = await response.json();

      if (data.status === 'OK' && data.data.matches) {
        return data.data.matches.map((m: { number: number; numberInSurah: number; surah: { number: number; englishName: string; }; text: string; }) => ({
          verseNumber: m.number,
          verseNumberInSurah: m.numberInSurah,
          surahNumber: m.surah.number,
          surahName: m.surah.englishName,
          text: isArabic ? m.text : '', 
          translation: isArabic ? '' : m.text,
        }));
      }
      return [];
    },
    enabled: queryInfo.type === 'text' && debouncedQuery.length > 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('recent-searches', []);

  const saveSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    
    // Synchronously write to localStorage to prevent navigation unmount race condition
    const currentStorage = window.localStorage.getItem('recent-searches');
    const prev = currentStorage ? JSON.parse(currentStorage) : [];
    const filtered = prev.filter((s: string) => s.toLowerCase() !== trimmed.toLowerCase());
    const newSearches = [trimmed, ...filtered].slice(0, 5);
    window.localStorage.setItem('recent-searches', JSON.stringify(newSearches));
    
    setRecentSearches(newSearches);
  };

  const clearSearchHistory = () => {
    setRecentSearches([]);
  };

  const performAction = (): boolean => {
    saveSearch(query);
    const instantQueryInfo = parseQueryString(query);
    if (instantQueryInfo.type === 'coordinate') {
      navigate(`/surah/${instantQueryInfo.surah}?verse=${instantQueryInfo.verse}`);
      return true;
    } else if (instantQueryInfo.type === 'surah_number') {
      navigate(`/surah/${instantQueryInfo.number}`);
      return true;
    }
    return false;
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    queryInfo,
    recentSearches,
    saveSearch,
    clearSearchHistory,
    performAction,
  };
}
