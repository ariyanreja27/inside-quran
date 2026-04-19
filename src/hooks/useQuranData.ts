import { useQuery } from '@tanstack/react-query';
import type { Verse } from '@/types/quran';
import { surahList, type SurahMeta } from '@/data/quranMeta';
import { useSettings } from './useAppStore';

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

/** Normalize Alif Wasla (ٱ U+0671) → plain Alif (ا U+0627) so no broken glyph appears above the letter */
function normalizeArabic(str: string): string {
  return str ? str.replace(/[\u0671\u0672]/g, '\u0627') : str;
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
      const translationLang =
        settings.language === 'bn' ? 'bn' :
        settings.language === 'hi' ? 'hi' :
        settings.language === 'ur' ? 'ur' :
        'en';

      const slug = surahSlug(surahNumber);

      // ── Fetch all files in PARALLEL for maximum speed ─────────────────────
      const [
        local,
        localTajweed,
        localTrans,
        localTranslit,
        localWaqf,
        localWbw,
      ] = await Promise.all([
        fetchLocal<LocalArabicFile>(`${LOCAL_DATA}/arabic/${slug}.json`),
        settings.showTajweed ? fetchLocal<LocalTransFile>(`${LOCAL_DATA}/tajweed/${slug}.json`) : Promise.resolve(null),
        fetchLocal<LocalTransFile>(`${LOCAL_DATA}/translations/${translationLang}/${slug}.json`),
        fetchLocal<LocalTransFile>(`${LOCAL_DATA}/transliterations/${translationLang}/${slug}.json`),
        fetchLocal<LocalWaqfFile>(`${LOCAL_DATA}/waqf/${slug}.json`),
        fetchLocal<LocalWbwFile>(`${LOCAL_DATA}/word-by-word/${slug}.json`),
      ]);

      const arabicVerses = local?.verses || [];

      // Build tajweed map
      let tajweedVerses: Record<number, string> | null = null;
      if (settings.showTajweed && localTajweed?.verses?.length) {
        tajweedVerses = {};
        localTajweed.verses.forEach(v => { tajweedVerses![v.numberInSurah] = v.text; });
      }

      // Build translation map
      const translationMap: Record<number, string> = {};
      if (localTrans?.verses?.length) {
        localTrans.verses.forEach(v => { translationMap[v.numberInSurah] = v.text; });
      }

      // Build transliteration map
      const transliterationMap: Record<number, string> = {};
      if (localTranslit?.verses?.length) {
        localTranslit.verses.forEach(v => { transliterationMap[v.numberInSurah] = v.text; });
      }

      // Build waqf map
      const waqfMap: Record<number, string> = {};
      if (localWaqf?.verses?.length) {
        localWaqf.verses.forEach(v => { if (v.waqfMark) waqfMap[v.numberInSurah] = v.waqfMark; });
      }

      // Build word-by-word map
      const wbwMap: Record<number, LocalWord[]> = {};
      if (localWbw?.verses?.length) {
        localWbw.verses.forEach(v => { wbwMap[v.numberInSurah] = v.words; });
      }

      // ── 6. Build the unified Verse array ───────────────────────────────────
      return arabicVerses.map(a => {
        // If tajweed flag is active and we captured it, lay it atop the standard text
        let text = a.text;
        if (settings.showTajweed && tajweedVerses && tajweedVerses[a.numberInSurah]) {
          text = tajweedVerses[a.numberInSurah];
        }

        // Apply Alif Wasla normalization to the verse text (removes broken glyph above ا)
        text = normalizeArabic(text);

        return {
          number: a.numberInSurah, // global ayah number approx
          numberInSurah: a.numberInSurah,
          text,
          translation: translationMap[a.numberInSurah] || '',
          transliteration: transliterationMap[a.numberInSurah] || '',
          waqf: waqfMap[a.numberInSurah],
          juz: a.juz,
          page: a.page,
          hizbQuarter: a.hizbQuarter,
          ruku: a.ruku,
          surahNumber,
          words: (wbwMap[a.numberInSurah] || []).map(w => ({
            ...w,
            text: normalizeArabic(w.text),
            transliteration: normalizeTransliteration(w.transliteration)
          })),
        };
      });
    },
    staleTime: Infinity,
    enabled: surahNumber > 0,
  });
}
