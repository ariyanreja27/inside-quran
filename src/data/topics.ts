export interface Topic {
  id: string;
  title: string;
  description: string;
  iconName: string;
  verses: {
    surah: number;
    verse: number;
    title?: string;
  }[];
}

export const topics: Topic[] = [
  {
    id: 'faith',
    title: 'Faith & Belief',
    description: 'Verses about the oneness of Allah, His attributes, and the core pillars of Iman.',
    iconName: 'Sparkles',
    verses: [
      { surah: 2, verse: 255, title: 'Ayat al-Kursi (The Throne Verse)' },
      { surah: 112, verse: 1, title: 'Oneness of Allah' },
      { surah: 2, verse: 285, title: 'Belief in All Prophets and Books' },
    ]
  },
  {
    id: 'patience',
    title: 'Patience & Perseverance',
    description: 'Guidance on staying firm during trials and the rewards of Sabr.',
    iconName: 'Timer',
    verses: [
      { surah: 2, verse: 153, title: 'Seeking help through patience and prayer' },
      { surah: 94, verse: 5, title: 'Ease follows hardship' },
      { surah: 3, verse: 200, title: 'Final exhortation to patience' },
    ]
  },
  {
    id: 'ethics',
    title: 'Ethics & Character',
    description: 'Mandates on honesty, kindness to parents, and social justice.',
    iconName: 'Users',
    verses: [
      { surah: 17, verse: 23, title: 'Kindness to Parents' },
      { surah: 49, verse: 10, title: 'Brotherhood and Peace' },
      { surah: 16, verse: 90, title: 'Justice and Goodness' },
    ]
  },
  {
    id: 'afterlife',
    title: 'The Afterlife',
    description: 'Descriptions of Paradise, the Day of Judgment, and the eternal journey.',
    iconName: 'CloudSun',
    verses: [
      { surah: 56, verse: 10, title: 'The Foremost in Faith' },
      { surah: 78, verse: 31, title: 'Success for the Righteous' },
      { surah: 3, verse: 185, title: 'The Reality of Death' },
    ]
  }
];
