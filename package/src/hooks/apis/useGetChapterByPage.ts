import {useEffect, useState} from 'react';
import {
  IChapterLookUp,
  IChapterVerses,
  IQuranJuzs,
  ISurahVerse,
  QuranTypesEnums,
} from '../../types';
import {
  DEFAULT_VERSES_PARAMS,
  QURAN_CHAPTERS_DIRECTORY,
  QURAN_JUZS_DIRECTORY,
  QuranJuzs,
} from '../../common';
import {
  axiosInstance,
  handleQuranChaptersDirectory,
  handleQuranJuzsDirectory,
  isFileExists,
  readFromLocalStorageFile,
  saveChapterAsJsonFile,
} from '../../utils';
import {usePageFontFileController, usePageLineController} from '../controllers';
interface IProps {
  chapterLookUp: IChapterLookUp[] | undefined;
  chapterId: number;
  type: QuranTypesEnums;
  QURAN_FONTS_API: string;
}
const useGetChapterByPage = ({
  chapterLookUp,
  chapterId,
  type,
  QURAN_FONTS_API,
}: IProps) => {
  const [chapterVerses, setChapterVerse] = useState<IChapterVerses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chapterProgress, setChapterProgress] = useState(0);

  const {downoladThePageFont} = usePageFontFileController();
  const {_renderVersesNewForm} = usePageLineController();

  useEffect(() => {
    checkIfTheChapterFileExistsInLocalStorage();
  }, []);
  const setChapetersHandler = (chapters: IChapterVerses[]) => {
    setChapterVerse([...chapters]);
  };

  const checkIfTheChapterFileExistsInLocalStorage = async () => {
    const chapterFileName = `${chapterId}.json`;
    const chapterPath = `${
      type === QuranTypesEnums?.chapter
        ? QURAN_CHAPTERS_DIRECTORY
        : QURAN_JUZS_DIRECTORY
    }/${chapterFileName}`;
    const isFileExistsLocaly = await isFileExists(chapterPath);
    if (type === QuranTypesEnums.chapter) await handleQuranChaptersDirectory();
    else await handleQuranJuzsDirectory();

    if (!isFileExistsLocaly) {
      const res: IChapterVerses[] | undefined | any =
        await getTargetChapterPage();
      await saveChapterAsJsonFile(chapterFileName, JSON.stringify(res), type);
      await handleFontLoad(res);
      if (res) setChapetersHandler([...res]);
    } else {
      const storedChapterFile = await readFromLocalStorageFile(
        chapterFileName,
        type,
      );
      await handleFontLoad(JSON.parse(storedChapterFile as any));
      if (storedChapterFile)
        setChapetersHandler([...JSON.parse(storedChapterFile)]);
    }
  };
  const handleFontLoad = async (verses: ISurahVerse[]) => {
    const pagesNumbers = getSurahOrJuzPagesCount(verses);
    const promises = pagesNumbers?.map((item: number, index) => {
      return downoladThePageFont(Number(item), () => {}, QURAN_FONTS_API);
    });
    try {
      const promiseRes = await Promise.all(promises);
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (e) {}
  };

  const getTargetChapterPage = async () => {
    const params = _rednerQueryParams();
    try {
      const response = await axiosInstance.get(
        `/verses/by_${type}/${chapterId}?${params}`,
        {
          onDownloadProgress: progressEvent => {
            if (progressEvent && progressEvent?.total) {
              setChapterProgress(
                Math.round((progressEvent.loaded / progressEvent?.total) * 100),
              );
            }
          },
        },
      );
      const allChapterVerses: ISurahVerse[] = response?.data?.verses;
      return await handleAllChapterPagesFormat(allChapterVerses);
    } catch (e) {}
  };
  const getSurahOrJuzPagesCount = (verses: ISurahVerse[]) => {
    const pagesNumbers: number[] = [];
    verses?.map((verse: ISurahVerse) => {
      if (!pagesNumbers.includes(verse?.page_number))
        pagesNumbers.push(verse?.page_number);
    });
    return pagesNumbers;
  };
  const handleAllChapterPagesFormat = async (
    allChapterVerses: ISurahVerse[],
  ) => {
    const chapterPagesWithVersesToSave = [];
    const pagesArr = getSurahOrJuzPagesCount(allChapterVerses);
    const pagesCount = pagesArr?.length;
    for (let i = 0; i < pagesCount; i++) {
      const currentPage: any = pagesArr[i];
      const currentPageVerses = allChapterVerses?.filter(
        item => item?.page_number == currentPage,
      );
      const currentPageJuzNumber = currentPageVerses[0]?.juz_number;
      const chapter_id = currentPageVerses[0]?.chapter_id;
      const isFirstChapterPage = currentPageVerses[0]?.verse_number == 1;
      chapterPagesWithVersesToSave.push({
        verses: _renderVersesNewForm({
          pageVerses: currentPageVerses,
        }),
        page_number: currentPage,
        juz_number: currentPageJuzNumber,
        originalVerses: currentPageVerses,
        chapter_id,
        isFirstChapterPage,
      });
    }

    return chapterPagesWithVersesToSave;
  };
  const _rednerQueryParams = () => {
    const juzVersesCount = QuranTypesEnums?.juz
      ? QuranJuzs.find((item: IQuranJuzs) => item?.juz_number == chapterId)
          ?.verses_count
      : 0;
    const per_page = type === QuranTypesEnums.chapter ? 'all' : juzVersesCount;
    const queryParams = {
      ...DEFAULT_VERSES_PARAMS,
      per_page,
    };
    const queryString = Object.entries(queryParams)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      )
      .join('&');
    return queryString;
  };
  return {chapterVerses, isLoading, chapterProgress};
};

export default useGetChapterByPage;
