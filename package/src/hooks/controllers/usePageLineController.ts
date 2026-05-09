import {useMemo} from 'react';
import {ILineNumber, ISurahVerse, IVerseWord} from '../../types';

const loopOnEachWord = (
  verseWords: IVerseWord[],
  lineNumbers: ILineNumber[],
  verse: ISurahVerse,
) => {
  for (let x = 0; x < verseWords.length; x++) {
    const wordObj = verseWords[x];
    const wordLineNumber = wordObj?.line_number;
    const lineNumberIndex = lineNumbers.findIndex(
      item => item?.lineNumber == wordLineNumber,
    );
    lineNumbers = addOrUpdatePageLineNumber(
      lineNumberIndex,
      lineNumbers,
      wordLineNumber,
      wordObj,
      verse,
    );
  }
  return lineNumbers;
};
const _renderWordObjectFormat = (word: IVerseWord) => ({
  id: word?.id,
  verse_key: word?.verse_key,
  code_v1: word?.code_v1,
  code_v2: word?.code_v2,
});
const _renderVerseObjectFormat = (verse: ISurahVerse) => ({
  id: verse?.id,
  verse_number: verse?.verse_number,
  verse_key: verse?.verse_key,
  chapter_id: verse?.chapter_id,
  page_number: verse?.page_number,
  text_uthmani: verse?.text_uthmani,
});

const addOrUpdatePageLineNumber = (
  lineNumberIndex: number,
  lineNumbers: ILineNumber[],
  wordLineNumber: number,
  wordObj: IVerseWord,
  verse: ISurahVerse,
) => {
  // to know if the first line property detected before or not
  const isFirstLineAssignedBefore = lineNumbers?.some(
    (item: ILineNumber) =>
      item?.chapter_id == verse?.chapter_id && item?.isFirstLine,
  );
  if (lineNumberIndex === -1) {
    const wordCodeV1 = wordObj?.code_v1;
    lineNumbers.push({
      lineNumber: wordLineNumber,
      isFirstLine: isFirstLineAssignedBefore ? false : verse?.verse_number == 1,
      chapter_id: verse?.chapter_id,
      words: [
        {
          ...(_renderWordObjectFormat(wordObj) as IVerseWord),
          page_number: wordObj?.page_number,
          verseData: _renderVerseObjectFormat(verse) as ISurahVerse,
          char_type_name: wordObj?.char_type_name,
          text: wordObj?.text_uthmani,
        },
      ],
      wordCodeV1,
      page_number: wordObj?.page_number,
    });
  } else {
    const wordCodeV1 = `${lineNumbers[lineNumberIndex]?.wordCodeV1}${wordObj?.code_v1}`;
    lineNumbers[lineNumberIndex] = {
      lineNumber: wordLineNumber,
      chapter_id: verse?.chapter_id,
      isFirstLine: lineNumbers[lineNumberIndex]?.isFirstLine,
      words: [
        ...(lineNumbers[lineNumberIndex]?.words as any),
        {
          ...(_renderWordObjectFormat(wordObj) as IVerseWord),
          page_number: wordObj?.page_number,
          char_type_name: wordObj?.char_type_name,
          verseData: _renderVerseObjectFormat(verse) as ISurahVerse,
          text: wordObj?.text_uthmani,
        },
      ],
      wordCodeV1,
      page_number: wordObj?.page_number,
    };
  }
  return lineNumbers;
};
const _renderVersesNewForm = ({pageVerses}: {pageVerses: ISurahVerse[]}) => {
  if (!pageVerses?.length) return;
  let lineNumbers: {lineNumber: number; words: IVerseWord[]}[] = [];
  // loop on each verse
  for (let i = 0; i < pageVerses.length; i++) {
    const verseWords = pageVerses[i].words;
    lineNumbers = loopOnEachWord(verseWords, lineNumbers, pageVerses[i]);
  }

  return lineNumbers;
};

const usePageLineController = () => {
  return {_renderVersesNewForm};
};

export default usePageLineController;
