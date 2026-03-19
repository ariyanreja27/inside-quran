import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Explanation, Bookmark, LastPosition } from '@/types/quran';

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<number[]>('iq-favorites', []);

  const toggleFavorite = (surahNumber: number) => {
    setFavorites(prev =>
      prev.includes(surahNumber)
        ? prev.filter(n => n !== surahNumber)
        : [...prev, surahNumber]
    );
  };

  const isFavorite = (surahNumber: number) => favorites.includes(surahNumber);

  return { favorites, toggleFavorite, isFavorite };
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('iq-bookmarks', []);

  const toggleBookmark = (surahNumber: number, ayahNumber: number) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber);
      if (exists) {
        return prev.filter(b => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber));
      }
      return [...prev, { surahNumber, ayahNumber, createdAt: new Date().toISOString() }];
    });
  };

  const isBookmarked = (surahNumber: number, ayahNumber: number) =>
    bookmarks.some(b => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber);

  return { bookmarks, toggleBookmark, isBookmarked };
}

export function useExplanations() {
  const [explanations, setExplanations] = useLocalStorage<Explanation[]>('iq-explanations', []);

  const getExplanation = (surahNumber: number, ayahNumber: number) =>
    explanations.find(e => e.surahNumber === surahNumber && e.ayahs.includes(ayahNumber));

  const hasExplanation = (surahNumber: number, ayahNumber: number) =>
    explanations.some(e => e.surahNumber === surahNumber && e.ayahs.includes(ayahNumber));

  const saveExplanation = (explanation: Explanation) => {
    setExplanations(prev => {
      const idx = prev.findIndex(e => e.id === explanation.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...explanation, updatedAt: new Date().toISOString() };
        return updated;
      }
      return [...prev, explanation];
    });
  };

  const deleteExplanation = (id: string) => {
    setExplanations(prev => prev.filter(e => e.id !== id));
  };

  return { explanations, getExplanation, hasExplanation, saveExplanation, deleteExplanation };
}

export function useLastPosition() {
  const [position, setPosition] = useLocalStorage<LastPosition | null>('iq-last-position', null);
  return { position, setPosition };
}

export function useDarkMode() {
  const [isDark, setIsDark] = useLocalStorage<boolean>('iq-dark-mode', false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const setDarkMode = (value: boolean) => {
    setIsDark(value);
  };

  const toggle = () => {
    setIsDark(prev => !prev);
  };

  return { isDark, setDarkMode, toggle };
}
