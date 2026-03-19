import { useQuery } from '@tanstack/react-query';
import type { Surah, Ayah } from '@/types/quran';

const API_BASE = 'https://api.alquran.cloud/v1';

export function useSurahs() {
  return useQuery<Surah[]>({
    queryKey: ['surahs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/surah`);
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.data.map((s: any) => ({
        number: s.number,
        name: s.name,
        englishName: s.englishName,
        englishNameTranslation: s.englishNameTranslation,
        numberOfAyahs: s.numberOfAyahs,
        revelationType: s.revelationType,
      }));
    },
    staleTime: Infinity,
  });
}

export function useSurahAyahs(surahNumber: number) {
  return useQuery<Ayah[]>({
    queryKey: ['surah-ayahs', surahNumber],
    queryFn: async () => {
      const [arabicRes, translationRes] = await Promise.all([
        fetch(`${API_BASE}/surah/${surahNumber}`),
        fetch(`${API_BASE}/surah/${surahNumber}/en.sahih`),
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
