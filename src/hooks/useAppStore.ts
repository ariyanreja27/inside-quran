import { useEffect, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Explanation, Bookmark, LastPosition, LastReadItem, Collection, CollectionItem, Note } from '@/types/quran';

export interface TafsirSource {
  id: string;
  name: string;
}

export interface TafsirRecord {
  id: string;
  surahNumber: number;
  verseNumber: number;
  tafsirs: Record<string, string>;
  sources?: TafsirSource[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  language: 'en' | 'bn' | 'hi' | 'ur';
  arabicFont: 'Amiri' | 'Noorehuda';
  arabicFontSize: number;
  translationFontSize: number;
  lineSpacing: number;
  showOnlyExplained: boolean;
  showTajweed: boolean;
}

export const defaultSettings: UserSettings = {
  language: 'en',
  arabicFont: 'Amiri',
  arabicFontSize: 24,
  translationFontSize: 14,
  lineSpacing: 2.0,
  showOnlyExplained: false,
  showTajweed: true,
};

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<UserSettings>('iq-settings', defaultSettings);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  useEffect(() => {
    // Dynamically apply chosen Arabic font to the CSS variables
    const fontStr = settings.arabicFont === 'Noorehuda' 
      ? "'Noorehuda', 'Amiri', 'Traditional Arabic', serif"
      : "'Amiri', 'Traditional Arabic', serif";
    document.documentElement.style.setProperty('--font-arabic', fontStr);
  }, [settings.arabicFont]);

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

  const removeLastRead = useCallback((surahNumber: number) => {
    setLastRead(prev => prev.filter(item => item.surahNumber !== surahNumber));
  }, [setLastRead]);

  return { lastRead, saveLastRead, removeLastRead };
}

export function useTafsirSources() {
  const defaultSources: TafsirSource[] = [
    { id: '1', name: 'Ibn Kathir' },
    { id: '2', name: 'Jalalayn' }
  ];
  const [sources, setSources] = useLocalStorage<TafsirSource[]>('iq-tafsir-sources', defaultSources);

  const addSource = (name: string) => {
    setSources(prev => [...prev, { id: Date.now().toString(), name }]);
  };

  const updateSource = (id: string, name: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const deleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  };

  return { sources, addSource, updateSource, deleteSource };
}

export function useCustomTafsirs() {
  const [tafsirRecords, setTafsirRecords] = useLocalStorage<TafsirRecord[]>('iq-tafsir-records', []);

  const getTafsirRecord = (surahNumber: number, verseNumber: number) => {
    return tafsirRecords.find(t => t.surahNumber === surahNumber && t.verseNumber === verseNumber);
  };

  const hasTafsir = (surahNumber: number, verseNumber: number) => {
    return tafsirRecords.some(t => t.surahNumber === surahNumber && t.verseNumber === verseNumber);
  };

  const saveTafsirRecord = (record: TafsirRecord) => {
    setTafsirRecords(prev => {
      const idx = prev.findIndex(t => t.id === record.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...record, updatedAt: new Date().toISOString() };
        return next;
      }
      return [...prev, record];
    });
  };

  const deleteTafsirRecord = (id: string) => {
    setTafsirRecords(prev => prev.filter(t => t.id !== id));
  };

  return { tafsirRecords, getTafsirRecord, hasTafsir, saveTafsirRecord, deleteTafsirRecord };
}

export function useCollections() {
  const [collections, setCollections] = useLocalStorage<Collection[]>('iq-collections', []);

  const addCollection = (name: string) => {
    const newCollection: Collection = {
      id: Date.now().toString(),
      name,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCollections(prev => [...prev, newCollection]);
  };

  const deleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
  };

  const renameCollection = (id: string, name: string) => {
    setCollections(prev => prev.map(c => 
      c.id === id ? { ...c, name, updatedAt: new Date().toISOString() } : c
    ));
  };

  const addItemToCollection = (collectionId: string, surahNumber: number, verseNumber: number) => {
    setCollections(prev => prev.map(c => {
      if (c.id === collectionId) {
        const itemExists = c.items.some(item => item.surahNumber === surahNumber && item.verseNumber === verseNumber);
        if (itemExists) return c;
        
        return {
          ...c,
          items: [...c.items, { surahNumber, verseNumber, timestamp: new Date().toISOString() }],
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    }));
  };

  const removeItemFromCollection = (collectionId: string, surahNumber: number, verseNumber: number) => {
    setCollections(prev => prev.map(c => {
      if (c.id === collectionId) {
        return {
          ...c,
          items: c.items.filter(item => !(item.surahNumber === surahNumber && item.verseNumber === verseNumber)),
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    }));
  };

  return { collections, addCollection, deleteCollection, renameCollection, addItemToCollection, removeItemFromCollection };
}

export function useNotes() {
  const [notes, setNotes] = useLocalStorage<Note[]>('iq-notes', []);

  const addNote = (surahNumber: number, verseNumber: number, content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      surahNumber,
      verseNumber,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (id: string, content: string) => {
    setNotes(prev => prev.map(n => 
      n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const getNote = (id: string) => notes.find(n => n.id === id);

  return { notes, addNote, updateNote, deleteNote, getNote };
}

export function useImportExport() {
  const exportData = () => {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('iq-')) {
        const val = localStorage.getItem(key);
        if (val) {
          try {
            data[key] = JSON.parse(val);
          } catch (e) {
            data[key] = val;
          }
        }
      }
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inside-quran-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          Object.keys(data).forEach(key => {
            if (key.startsWith('iq-')) {
              localStorage.setItem(key, JSON.stringify(data[key]));
            }
          });
          resolve(true);
        } catch (err) {
          console.error('Import failed', err);
          resolve(false);
        }
      };
      reader.readAsText(file);
    });
  };

  return { exportData, importData };
}
