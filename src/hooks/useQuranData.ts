import { useQuery } from '@tanstack/react-query';
import type { Verse } from '@/types/quran';
import { surahList, type SurahMeta } from '@/data/quranMeta';
import { useSettings } from './useAppStore';
import { getApiUrl } from '@/utils/api';

// ─── Local data paths (served from public/data/) ─────────────────────────────
const LOCAL_DATA = '/data';

/** Maps a surah number + name to a zero-padded slug filename, matching the fetch script */
function surahSlug(surahNumber: number): string {
  const meta = surahList.find(s => s.number === surahNumber);
  if (!meta) return String(surahNumber).padStart(3, '0');
  const slug = meta.name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${String(surahNumber).padStart(3, '0')}-${slug}`;
}

/** 
 * Normalizes transliteration by fixing data artifacts like 'l-' at the start of a word.
 * In Quranic WBW data, 'l-' often represents the definite article 'Al' when joined.
 */
function normalizeTransliteration(str: string): string {
  if (!str) return str;
  const trimmed = str.trim();
  if (trimmed.toLowerCase().startsWith('l-')) {
    return 'al-' + trimmed.slice(2);
  }
  return trimmed;
}

/** Normalize Alif Wasla (ٱ U+0671) → plain Alif (ا U+0627) so no broken glyph appears above the letter.
 * Also remove U+06DF and U+06E0 which cause massive black fallback dots in certain fonts. */
function normalizeArabic(str: string): string {
  if (!str) return str;
  return str.replace(/[\u0671\u0672]/g, '\u0627').replace(/[\u06DF\u06E0]/g, '');
}

/** Try to fetch a local JSON file; returns null if not available (offline / file missing) */
async function fetchLocal<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ─── Type stubs for local JSON shapes ────────────────────────────────────────
interface LocalArabicVerse  { numberInSurah: number; text: string; juz: number; page: number; hizbQuarter: number; ruku: number; }
interface LocalArabicFile   { surahNumber: number; verses: LocalArabicVerse[]; }
interface LocalTransVerse   { numberInSurah: number; text: string; }
interface LocalTransFile    { surahNumber: number; verses: LocalTransVerse[]; }
interface LocalWaqfVerse    { numberInSurah: number; waqfMark: string; }
interface LocalWaqfFile     { surahNumber: number; verses: LocalWaqfVerse[]; }
interface LocalWord         { id: number; position: number; text: string; transliteration: string; translation: string; rootLetters?: string | null; charTypeName?: string | null; location?: string | null; }
interface LocalWbwVerse     { numberInSurah: number; words: LocalWord[]; }
interface LocalWbwFile      { surahNumber: number; verses: LocalWbwVerse[]; }

// ─── Mushaf Page Interfaces ────────────────────────────────────────────────
export interface MushafWord {
  id: number;
  position: number;
  text_uthmani: string;
  text_tajweed?: string;
  char_type_name: string;
  verse_key: string;
}

export interface MushafPage {
  page_number: number;
  lines: Record<number, MushafWord[]>;
}

export interface MushafMeta {
  surah_start_pages: Record<number, number>;
}


export function useSurahs() {
  return useQuery<SurahMeta[]>({
    queryKey: ['surahs'],
    queryFn: async () => {
      return surahList;
    },
    staleTime: Infinity,
  });
}

export function useSurahVerses(surahNumber: number) {
  const { settings } = useSettings();

  return useQuery<Verse[]>({
    queryKey: ['surah-verses', surahNumber, settings.language, settings.showTajweed, settings.arabicFont],
    queryFn: async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/surahs/${surahNumber}/verses`);
        if (!response.ok) throw new Error('Failed to fetch verses from API');
        
        const data = await response.json();
        const translationLang = settings.language || 'en';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.verses.map((v: any) => {
          // Use the requested font field
          const targetFontField = settings.arabicFont;

          let text = v[targetFontField] || v.text_uthmani || v.text;

          if (settings.showTajweed && v.tajweedText) {
            text = v.tajweedText;
          }

          text = normalizeArabic(text);

          const verseNum = v.verse_number || v.id || v.numberInSurah;
          
          return {
            number: verseNum,
            numberInSurah: verseNum,
            text,
            translation: v.translations?.[translationLang] || '',
            transliteration: v.transliteration || '',
            waqf: v.waqf || null,
            juz: v.juz_number || 0,
            page: v.page_number || 0,
            hizbQuarter: v.hizb_number || 0,
            ruku: v.rub_el_hizb_number || 0, // Fallback approximations
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            words: (v.wbw || v.words || []).map((w: any) => ({
              ...w,
              text: normalizeArabic(
                settings.arabicFont === 'text_qpc_hafs'
                  ? (w.text_qpc_hafs || w.text_uthmani || w.text) 
                  : (w.text_uthmani || w.text)
              ),
              transliteration: normalizeTransliteration(w.transliteration || w.transliteration?.text || ''),
              translation: w.translation?.text || w.translation || ''
            })),
          };
        });
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    staleTime: Infinity,
    enabled: surahNumber > 0,
  });
}
