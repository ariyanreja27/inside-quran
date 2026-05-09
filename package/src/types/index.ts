import {MutableRefObject, ReactNode} from 'react';
import {
  ColorValue,
  ImageResizeMode,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
} from 'react-native';

export interface IChapterLookUp {
  page_number: string;
  page_range: {
    from: string;
    to: string;
    first_verse_key: string;
    last_verse_key: string;
  };
}

export interface ISurahVerse {
  id: number;
  verse_key: string;
  hizb_number: number;
  rub_el_hizb_number: number;
  ruku_number: number;
  manzil_number: number;
  sajdah_number: null;
  text_uthmani: string;
  chapter_id: number;
  text_imlaei_simple: string;
  page_number: number;
  juz_number: number;
  words: IVerseWord[];
  chapter_code_v1: number;
  verse_font_famliy: string;
  verse_number: number;
}

export interface IVerseWord {
  id: number;
  position: number;
  audio_url: string;
  verse_key: string;
  verse_id: number;
  location: string;
  text_uthmani: string;
  qpc_uthmani_hafs: string;
  code_v1: string;
  code_v2: string;
  char_type_name: string;
  page_number: number;
  line_number: number;
  text: string;
  verseData: any;
}

export interface IPageVeseseObject {
  page_number: number;
  verses: ISurahVerse[];
}

interface IVerseDataInWord extends IVerseWord {
  verseData: ISurahVerse;
}
export interface ILineNumber {
  lineNumber: number;
  words: IVerseDataInWord[];
  wordCodeV1?: string;
  page_number?: number;
  isFirstLine?: boolean;
  chapter_id: number;
}

export interface IChapterVerses {
  verses: ILineNumber[] | undefined;
  page_number: number;
  juz_number: number;
  originalVerses: ISurahVerse[];
  chapter_id: number;
  isFirstChapterPage: boolean;
}

export interface ISelectedVerseLocation {
  itemLocationY: number;
  itemLocationX: number;
}
export interface IQuranChapters {
  revelationPlace: string;
  transliteratedName: string;
  versesCount: number;
  translatedName: string;
  slug: string;
  hasBasmalah?: boolean;
  code_v1: number;
  firstPage: number;
  lastPage?: number;
  id: number;
  type: string;
}

export interface IReciter {
  id: number;
  reciter_id: number;
  name: string;
}

export interface IAudioPlayerRef {
  setShowPlayerHandler: (value: boolean) => void;
  _renderSelelctedReciter: () => IReciter;
  isPlayerShown: () => boolean;
}

export interface IModalRef {
  openModal: () => void;
  closeModal: () => void;
}

export interface IOptionsModal {
  selectedVerseLocation: ISelectedVerseLocation | undefined;
  selectedVerse: ISurahVerse;
  seSelectedVerse: (verse: ISurahVerse) => void;
  handlePlayPress: () => void;
  selectedReciter: IReciter | undefined;
  onBookMarkedVerse?: (verse: ISurahVerse) => void;
  chapterId: number;
  autoCompleteAudioAfterPlayingVerse?: boolean;
}

export interface IPageVersesListRef {
  setSelectedVerseHandler: (verse: ISurahVerse) => void | undefined;
}

export interface IVersesBeforeAndAfterCurrentVerse {
  beforeCurrentVerse: ISurahVerse | null;
  afterCurrentVerse: ISurahVerse | null;
}

export interface IPageVersesList {
  setSelectedVerse: (value: ISurahVerse) => void;
  selectedVerse: ISurahVerse;
  pageVersesToDisplay: ILineNumber[] | undefined;
  audioPlayerRef: MutableRefObject<IAudioPlayerRef | undefined>;
  onContainerPress: () => void;
  chapterId: number;
  showChapterName: boolean;
  showBismllah: boolean;
  pageNumber: number;
  juzNumber: number;
  setVersesBeforeAndAfterCurrentVerse: (
    value: IVersesBeforeAndAfterCurrentVerse,
  ) => void;
  originalVerse: ISurahVerse[];
  onBookMarkedVerse?: (verse: ISurahVerse) => void;
  backgroundImage?: ImageSourcePropType;
  surahNameFrameImage?: ImageSourcePropType;
  quranPageContainerStyle?: StyleProp<ViewStyle>;
  resizeImageBackgroundMode?: ImageResizeMode;
  selectionColor?: ColorValue;
  autoCompleteAudioAfterPlayingVerse?: boolean;
  type: QuranTypesEnums;
}

export interface IQuranPageLayout {
  chapterId: number;
  type?: QuranTypesEnums;
  chapterHeader?: ReactNode;
  QURAN_FONTS_API: string;
  showSlider?: boolean;
  selectedBookedMarkedVerse?: ISurahVerse;
  onBookMarkedVerse?: (verse: ISurahVerse) => void;
  backgroundImage?: ImageSourcePropType;
  surahNameFrameImage?: ImageSourcePropType;
  resizeImageBackgroundMode?: ImageResizeMode;
  quranPageContainerStyle?: StyleProp<ViewStyle>;
  selectionColor?: ColorValue;
  autoCompleteAudioAfterPlayingVerse?: boolean;
}

export enum QuranTypesEnums {
  chapter = 'chapter',
  juz = 'juz',
}

export interface IQuranJuzs {
  id: number;
  juz_number: number;
  verse_mapping: any;
  first_verse_id: number;
  last_verse_id: number;
  verses_count: number;
}
