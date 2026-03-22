import { useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Explanation, Bookmark, LastPosition, LastReadItem } from '@/types/quran';

export interface UserSettings {
  language: 'en' | 'bn' | 'hi' | 'ur';
  arabicFontSize: number;
  translationFontSize: number;
  lineSpacing: number;
  showOnlyExplained: boolean;
}

export const defaultSettings: UserSettings = {
  language: 'en',
  arabicFontSize: 24,
  translationFontSize: 14,
  lineSpacing: 2.0,
  showOnlyExplained: false,
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<UserSettings>('iq-settings', defaultSettings);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return { settings, updateSettings };
}

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
  
  const clearFavorites = () => setFavorites([]);

  return { favorites, toggleFavorite, isFavorite, clearFavorites };
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>('iq-bookmarks', []);

  const toggleBookmark = (surahNumber: number, verseNumber: number) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.surahNumber === surahNumber && (b.verseNumber === verseNumber || (b as unknown as Record<string, unknown>).ayahNumber === verseNumber));
      if (exists) {
        return prev.filter(b => !(b.surahNumber === surahNumber && (b.verseNumber === verseNumber || (b as unknown as Record<string, unknown>).ayahNumber === verseNumber)));
      }
      return [...prev, { surahNumber, verseNumber, createdAt: new Date().toISOString() }];
    });
  };

  const isBookmarked = (surahNumber: number, verseNumber: number) =>
    bookmarks.some(b => b.surahNumber === surahNumber && (b.verseNumber === verseNumber || (b as unknown as Record<string, unknown>).ayahNumber === verseNumber));

  const clearBookmarks = () => setBookmarks([]);

  return { bookmarks, toggleBookmark, isBookmarked, clearBookmarks };
}

export function useExplanations() {
  const [explanations, setExplanations] = useLocalStorage<Explanation[]>('iq-explanations', []);

  const getExplanation = (surahNumber: number, verseNumber: number) =>
    explanations.find(e => e.surahNumber === surahNumber && (e.verses || (e as unknown as Record<string, number[]>).ayahs || []).includes(verseNumber));

  const hasExplanation = (surahNumber: number, verseNumber: number) =>
    explanations.some(e => e.surahNumber === surahNumber && (e.verses || (e as unknown as Record<string, number[]>).ayahs || []).includes(verseNumber));

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
    // document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.remove('dark'); // Force light mode per user request
  }, [isDark]);

  const setDarkMode = (value: boolean) => {
    setIsDark(value);
  };

  const toggle = () => {
    setIsDark(prev => !prev);
  };

  return { isDark, setDarkMode, toggle };
}

export function useCustomTranslations() {
  const [customTranslations, setCustomTranslations] = useLocalStorage<Record<string, string>>('iq-custom-translations', {});

  const getCustomTranslation = (surahNumber: number, verseNumber: number, language: string) => {
    return customTranslations[`${surahNumber}-${verseNumber}-${language}`];
  };

  const saveCustomTranslation = (surahNumber: number, verseNumber: number, language: string, text: string) => {
    setCustomTranslations(prev => ({
      ...prev,
      [`${surahNumber}-${verseNumber}-${language}`]: text
    }));
  };

  const resetCustomTranslation = (surahNumber: number, verseNumber: number, language: string) => {
    setCustomTranslations(prev => {
      const next = { ...prev };
      delete next[`${surahNumber}-${verseNumber}-${language}`];
      return next;
    });
  };

  return { customTranslations, getCustomTranslation, saveCustomTranslation, resetCustomTranslation };
}

export function useLastRead() {
  const [lastRead, setLastRead] = useLocalStorage<LastReadItem[]>('iq-last-read', []);

  const saveLastRead = useCallback((surahNumber: number, verseNumber: number) => {
    setLastRead(prev => {
      const now = new Date().toISOString();
      const existingIdx = prev.findIndex(item => item.surahNumber === surahNumber);
      
      let newList = [...prev];
      if (existingIdx !== -1) {
        // If it's already at the top and verse hasn't changed, just update time maybe? 
        // We can just remove and insert at top.
        newList.splice(existingIdx, 1);
      }
      
      newList.unshift({ surahNumber, verseNumber, timestamp: now });
      
      // Optional limit history to say 50 items
      if (newList.length > 50) {
        newList = newList.slice(0, 50);
      }
      
      return newList;
    });
  }, [setLastRead]);

  return { lastRead, saveLastRead };
}
