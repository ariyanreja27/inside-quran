import RNFS from 'react-native-fs';

export const QURAN_API = 'https://api.qurancdn.com/api/qdc';
export const DEFAULT_VERSES_PARAMS = {
  words: true,
  translation_fields: 'resource_name,language_id',
  per_page: 'all',
  fields: 'text_uthmani,chapter_id,hizb_number,text_imlaei_simple',
  translations: 131,
  reciter: 7,
  mushaf: 2,
  word_fields:
    'verse_key,verse_id,page_number,location,text_uthmani,qpc_uthmani_hafs,code_v1,code_v2,uthmani_tajweed',
};

export const SURAH_WORD_AR = String.fromCharCode(92);
export const basmalah = '3 2 1';
export const ALTAWBA_CHAPTER_ID = 9;
export const ALFATIHA_CHAPTER_ID = 1;

export enum FONT_FAMILY {
  BISMLLAH = 'QCF_BSML',
  CAIRO = 'Cairo',
}

export const QURAN_CHAPTERS_DIRECTORY = `${RNFS.DocumentDirectoryPath}/QuranChapters`;
export const QURAN_JUZS_DIRECTORY = `${RNFS.DocumentDirectoryPath}/QuranJuzs`;
