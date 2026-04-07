export interface Dua {
  id: string;
  title: string;
  arabic: string;
  translation: string;
  reference: string;
  surah: number;
  verse: number;
}

export const duas: Dua[] = [
  {
    id: 'rabbana-1',
    title: 'For Good in Both Worlds',
    arabic: 'رَبَّنَآ ءَاتِنَا فِي ٱلدُّنْيَا حَسَنَةًۭ وَفِي ٱلْءَاخِرَةِ حَسَنَةًۭ وَقِنَا عَذَابَ ٱلنَّارِ',
    translation: 'Our Lord, give us in this world [that which is] good and in the Afterlife [that which is] good and protect us from the punishment of the Fire.',
    reference: 'Surah Al-Baqarah 2:201',
    surah: 2,
    verse: 201
  },
  {
    id: 'rabbana-2',
    title: 'For Patience and Steadicastness',
    arabic: 'رَبَّنَآ أَفْرِغْ عَلَيْنَا صَبْرًۭا وَثَبِّتْ أَقْدَامَنَا وَٱنصُرْنَا عَلَى ٱلْقَوْمِ ٱلْكَـٰفِرِينَ',
    translation: 'Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people.',
    reference: 'Surah Al-Baqarah 2:250',
    surah: 2,
    verse: 250
  },
  {
    id: 'prophet-1',
    title: "Prophet Yunus's Prayer",
    arabic: 'لَّآ إِلَـٰهَ إِلَّآ أَنتَ سُبْحَـٰنَكَ إِنِّى كُنتُ مِنَ ٱلظَّـٰلِمِينَ',
    translation: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.',
    reference: 'Surah Al-Anbiya 21:87',
    surah: 21,
    verse: 87
  },
  {
    id: 'guidance-1',
    title: 'For Guidance',
    arabic: 'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ',
    translation: 'Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower.',
    reference: "Surah Ali 'Imran 3:8",
    surah: 3,
    verse: 8
  }
];
