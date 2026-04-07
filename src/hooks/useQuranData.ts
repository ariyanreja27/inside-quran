import { useQuery } from '@tanstack/react-query';
import type { Verse } from '@/types/quran';
import { surahList, type SurahMeta } from '@/data/quranMeta';
import { useSettings } from './useAppStore';

const API_BASE = 'https://api.alquran.cloud/v1';

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
      const translationEdition = 
        settings.language === 'bn' ? 'bn.bengali' : 
        settings.language === 'hi' ? 'hi.hindi' : 
        'en.sahih';

      const arabicEndpoint = settings.showTajweed ? `${API_BASE}/surah/${surahNumber}/quran-tajweed` : `${API_BASE}/surah/${surahNumber}`;

      const [arabicRes, translationRes, waqfRes] = await Promise.all([
        fetch(arabicEndpoint),
        fetch(`${API_BASE}/surah/${surahNumber}/${translationEdition}`),
        fetch(`https://api.quran.com/api/v4/quran/verses/indopak?chapter_number=${surahNumber}`)
      ]);

      const [arabicData, translationData, waqfData] = await Promise.all([
        arabicRes.json(),
        translationRes.json(),
        waqfRes.json()
      ]);

      // Create a map of verse numbers to their stop markers from the Quran.com Indopak text
      const waqfMap: Record<number, string> = {};
      if (waqfData.verses) {
        waqfData.verses.forEach((v: any) => {
          const vNum = parseInt(v.verse_key.split(':')[1]);
          // Regex to extract stop marks (U+06D6 to U+06E0) from the end of the text
          const text = v.text_indopak || '';
          const match = text.match(/[\u06D6-\u06E0]+(?=[^\u0621-\u064A]*$)/);
          if (match) {
            waqfMap[vNum] = match[0];
          }
        });
      }

      return arabicData.data.ayahs.map((a: any, i: number) => {
        let text = a.text;
        
        // If we are fetching the Tajweed edition, normalize specific Uthmani-exclusive characters 
        // back to the Simple/IndoPak styling that the default API endpoint uses.
        // The user explicitly noted this normalizer looks better for the Amiri font, whereas Noorehuda handles the Uthmani string natively.
        if (settings.showTajweed && settings.arabicFont === 'Amiri') {
          text = text
            .replace(/\u0652/g, '\u06E1') // Round Sukun -> Quranic Sukun
            .replace(/\u064A/g, '\u06CC') // Standard Yeh -> Farsi Yeh
            .replace(/\u0649/g, '\u06CC') // Alef Maksura -> Farsi Yeh
            .replace(/\u0653/g, '\u06E4'); // Standard Madda -> Quranic Madda
        }

        // Strip Bismillah prefix from the first verse of every surah except Surah 1 (Al-Fatihah)
        if (surahNumber !== 1 && a.numberInSurah === 1) {
          const bismillah1 = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ";
          const bismillah2 = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
          // Also check normalized string just in case
          const bismillahNorm = bismillah2.replace(/\u0652/g, '\u06E1').replace(/\u064A/g, '\u06CC').replace(/\u0649/g, '\u06CC').replace(/\u0653/g, '\u06E4');
          
          if (text.startsWith(bismillah1)) {
            text = text.substring(bismillah1.length).trim();
          } else if (text.startsWith(bismillah2)) {
            text = text.substring(bismillah2.length).trim();
          } else if (text.startsWith(bismillahNorm)) {
            text = text.substring(bismillahNorm.length).trim();
          }
        }

        return {
          number: a.number,
          numberInSurah: a.numberInSurah,
          text: text,
          translation: translationData.data.ayahs[i]?.text || '',
          waqf: waqfMap[a.numberInSurah],
          juz: a.juz,
          page: a.page,
          hizbQuarter: a.hizbQuarter,
          ruku: a.ruku,
          surahNumber,
        };
      });
    },
    staleTime: Infinity,
    enabled: surahNumber > 0,
  });
}
