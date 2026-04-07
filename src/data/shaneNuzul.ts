export interface ShaneNuzul {
  id: string;
  title: string;
  surahNumber: number;
  verseNumber?: number;
  context: string;
}

export const shaneNuzul: ShaneNuzul[] = [
  {
    id: 'al-ikhlas',
    title: 'Focus on Sincerity (Al-Ikhlas)',
    surahNumber: 112,
    context: 'Revealed when some polytheists of Mecca asked the Prophet (PBUH) about the lineage of Allah. This Surah establishes the core monotheistic belief in Islam.'
  },
  {
    id: 'al-fatihah',
    title: 'The Opening (Al-Fatihah)',
    surahNumber: 1,
    context: 'The first complete Surah revealed in Mecca. It serves as a prayer for guidance and is considered the essence of the Quran.'
  },
  {
    id: 'ayat-al-kursi',
    title: 'The Throne Verse (Ayat al-Kursi)',
    surahNumber: 2,
    verseNumber: 255,
    context: 'Universally recognized as describing Allah\'s supreme power and authority over the universe. It is one of the most powerful and significant verses in the Quran.'
  },
  {
    id: 'an-nasr',
    title: 'The Victory (An-Nasr)',
    surahNumber: 110,
    context: 'One of the last Surahs revealed, signifying the completion of the Prophet\'s mission and the conquest of Mecca.'
  }
];
