import {IQuranChapters} from '../types';
import {QuranChapters, SURAH_WORD_AR} from '../common';

export const getChapterCodeV1 = (chapterId: number): number =>
  QuranChapters.find((item: IQuranChapters) => item?.id === chapterId)
    ?.code_v1 as number;

export const _renderChapterName = (chapterId: number) => {
  const surahName = `${String.fromCharCode(
    getChapterCodeV1(chapterId),
  )} ${SURAH_WORD_AR}`;
  return surahName;
};

export const _renderChapterAyahs = (chapterId: number) => {
  return QuranChapters?.find(chapter => chapter?.id == chapterId)?.versesCount;
};
