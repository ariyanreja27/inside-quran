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
    queryKey: ['surah-verses', surahNumber, settings.language],
    queryFn: async () => {
      const translationEdition = 
        settings.language === 'bn' ? 'bn.bengali' : 
        settings.language === 'hi' ? 'hi.hindi' : 
        'en.sahih';

      const [arabicRes, translationRes] = await Promise.all([
        fetch(`${API_BASE}/surah/${surahNumber}`),
        fetch(`${API_BASE}/surah/${surahNumber}/${translationEdition}`),
      ]);
      const arabicData = await arabicRes.json();
      const translationData = await translationRes.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return arabicData.data.ayahs.map((a: any, i: number) => {
        let text = a.text;
        // Strip Bismillah prefix from the first verse of every surah except Surah 1 (Al-Fatihah)
        if (surahNumber !== 1 && a.numberInSurah === 1) {
          const bismillah = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ";
          if (text.startsWith(bismillah)) {
            text = text.substring(bismillah.length).trim();
          }
        }

        return {
          number: a.number,
          numberInSurah: a.numberInSurah,
          text: text,
          translation: translationData.data.ayahs[i]?.text || '',
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
