import { useQuery } from '@tanstack/react-query';
import type { Ayah } from '@/types/quran';
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

export function useSurahAyahs(surahNumber: number) {
  const { settings } = useSettings();

  return useQuery<Ayah[]>({
    queryKey: ['surah-ayahs', surahNumber, settings.language],
    queryFn: async () => {
      const translationEdition = 
        settings.language === 'bn' ? 'bn.bengali' : 
        settings.language === 'hi' ? 'hi.hindi' : 
        settings.language === 'ur' ? 'ur.jandali' : 
        'en.sahih';

      const [arabicRes, translationRes] = await Promise.all([
        fetch(`${API_BASE}/surah/${surahNumber}`),
        fetch(`${API_BASE}/surah/${surahNumber}/${translationEdition}`),
      ]);
      const arabicData = await arabicRes.json();
      const translationData = await translationRes.json();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return arabicData.data.ayahs.map((a: any, i: number) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        text: a.text,
        translation: translationData.data.ayahs[i]?.text || '',
        juz: a.juz,
        page: a.page,
        hizbQuarter: a.hizbQuarter,
        ruku: a.ruku,
        surahNumber,
      }));
    },
    staleTime: Infinity,
    enabled: surahNumber > 0,
  });
}
