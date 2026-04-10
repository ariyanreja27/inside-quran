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

      // ── 1. Load Arabic text ─────────────────────────────────────────────────
      const local = await fetchLocal<LocalArabicFile>(`${LOCAL_DATA}/arabic/${slug}.json`);
      const arabicVerses = local?.verses || [];

      // If Tajweed mode, also parse the tajweed files to overlay color rendering atop the verse map
      let tajweedVerses: Record<number, string> | null = null;
      if (settings.showTajweed) {
        const localTajweed = await fetchLocal<any>(`${LOCAL_DATA}/tajweed/${slug}.json`);
        if (localTajweed?.verses?.length) {
          tajweedVerses = {};
          localTajweed.verses.forEach((v: any) => {
            tajweedVerses![v.numberInSurah] = v.text;
          });
        }
      }

      // ── 2. Load Translation ─────────────────────────────────────────────────
      let translationMap: Record<number, string> = {};
      const localTrans = await fetchLocal<LocalTransFile>(
        `${LOCAL_DATA}/translations/${translationLang}/${slug}.json`
      );
      if (localTrans?.verses?.length) {
        localTrans.verses.forEach(v => { translationMap[v.numberInSurah] = v.text; });
      }

      // ── 3. Load Waqf markers ────────────────────────────────────────────────
      const waqfMap: Record<number, string> = {};
      const localWaqf = await fetchLocal<LocalWaqfFile>(`${LOCAL_DATA}/waqf/${slug}.json`);
      if (localWaqf?.verses?.length) {
        localWaqf.verses.forEach(v => { if (v.waqfMark) waqfMap[v.numberInSurah] = v.waqfMark; });
      }

      // ── 4. Load Word-by-Word ────────────────────────────────────────────────
      const wbwMap: Record<number, any[]> = {};
      const localWbw = await fetchLocal<LocalWbwFile>(`${LOCAL_DATA}/word-by-word/${slug}.json`);
      if (localWbw?.verses?.length) {
        localWbw.verses.forEach(v => { wbwMap[v.numberInSurah] = v.words; });
      }

      // ── 5. Build the unified Verse array ───────────────────────────────────
      return arabicVerses.map(a => {
        // If tajweed flag is active and we captured it, lay it atop the standard text
        let text = a.text;
        if (settings.showTajweed && tajweedVerses && tajweedVerses[a.numberInSurah]) {
          text = tajweedVerses[a.numberInSurah];
        }

        // Tajweed normalization for Amiri font
        if (settings.showTajweed && settings.arabicFont === 'Amiri') {
          text = text
            .replace(/\u0652/g, '\u06E1') 
            .replace(/\u064A/g, '\u06CC') 
            .replace(/\u0649/g, '\u06CC') 
            .replace(/\u0653/g, '\u06E4'); 
        }
        
        return {
          number: a.numberInSurah, // global ayah number approx
          numberInSurah: a.numberInSurah,
          text,
          translation: translationMap[a.numberInSurah] || '',
          waqf: waqfMap[a.numberInSurah],
          juz: a.juz,
          page: a.page,
          hizbQuarter: a.hizbQuarter,
          ruku: a.ruku,
          surahNumber,
          words: wbwMap[a.numberInSurah] || [],
        };
      });
    },
    staleTime: Infinity,
    enabled: surahNumber > 0,
  });
}
