export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfVerses: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Verse {
  number: number;
  numberInSurah: number;
  text: string;
  translation: string;
  juz: number;
  page: number;
  hizbQuarter: number;
  ruku: number;
  surahNumber: number;
}

export interface RootWord {
  id: string;
  arabic: string;
  transliteration: string;
  rootLetters: string;
  explanation: string;
}

export interface DeeperLookCategory {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ConciseExplanation {
  id: string;
  title?: string;
  text: string;
}

export interface ConciseBlock {
  verseNumber: number;
  explanations: ConciseExplanation[];
}

export interface Explanation {
  id: string;
  surahNumber: number;
  verses: number[];
  verseRange?: string;
  concise: ConciseBlock[];
  deeperLook: {
    rootWords: RootWord[];
    categories: DeeperLookCategory[];
  };
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  surahNumber: number;
  verseNumber: number;
  createdAt: string;
}

export interface LastPosition {
  surahNumber: number;
  verseNumber: number;
}
