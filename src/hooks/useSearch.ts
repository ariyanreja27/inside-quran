import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSettings } from './useAppStore';
import { surahList } from '@/data/quranMeta';

const API_BASE = 'https://api.alquran.cloud/v1';

export interface SearchResult {
  ayahNumber: number;
  ayahNumberInSurah: number;
  surahNumber: number;
  surahName: string;
  text: string;
  translation: string;
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

  // Parse query type
  const queryInfo = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) return { type: 'empty' };

    // Coordinate search (e.g., "2:255")
    const coordMatch = trimmed.match(/^(\d+):(\d+)$/);
    if (coordMatch) {
      return { 
        type: 'coordinate', 
        surah: parseInt(coordMatch[1]), 
        ayah: parseInt(coordMatch[2]) 
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
  }, [debouncedQuery]);

  // Keyword search query
  const { data: results, isLoading, error } = useQuery<SearchResult[]>({
    queryKey: ['search', debouncedQuery, settings.language],
    queryFn: async () => {
      if (queryInfo.type !== 'text') return [];

      const isArabic = /[\u0600-\u06FF]/.test(queryInfo.text);
      
      const edition = isArabic ? 'quran-uthmani' : 
        settings.language === 'bn' ? 'bn.bengali' : 
        settings.language === 'hi' ? 'hi.hindi' : 
        settings.language === 'ur' ? 'ur.jandali' : 
        'en.sahih';

      const response = await fetch(`${API_BASE}/search/${queryInfo.text}/all/${edition}`);
      const data = await response.json();

      if (data.status === 'OK' && data.data.matches) {
        return data.data.matches.map((m: { number: number; numberInSurah: number; surah: { number: number; englishName: string; }; text: string; }) => ({
          ayahNumber: m.number,
          ayahNumberInSurah: m.numberInSurah,
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

  const performAction = () => {
    if (queryInfo.type === 'coordinate') {
      navigate(`/surah/${queryInfo.surah}?ayah=${queryInfo.ayah}`);
    } else if (queryInfo.type === 'surah_number') {
      navigate(`/surah/${queryInfo.number}`);
    }
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    queryInfo,
    performAction,
  };
}
