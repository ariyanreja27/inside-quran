import {ISurahVerse, IVersesBeforeAndAfterCurrentVerse} from '../types';

interface IProps {
  originalVerse: ISurahVerse[];
  selectedVerse: ISurahVerse;
  setVersesBeforeAndAfterCurrentVerse: (
    value: IVersesBeforeAndAfterCurrentVerse,
  ) => void;
}

const handleVersesBeforeAndAfterCurrentVerse = ({
  originalVerse,
  selectedVerse,
  setVersesBeforeAndAfterCurrentVerse,
}: IProps) => {
  const originalVerseLength = originalVerse?.length;
  const selectedVerseIndex = originalVerse?.findIndex(
    (item: ISurahVerse) => item?.id === selectedVerse?.id,
  );
  const indexOfVerseAfterSelectedVerse =
    selectedVerseIndex + 1 <= originalVerseLength - 1
      ? selectedVerseIndex + 1
      : -1;
  const indexOfVerseBeforeSelectedVerse =
    selectedVerseIndex - 1 <= originalVerseLength - 1 &&
    selectedVerseIndex - 1 >= 0
      ? selectedVerseIndex - 1
      : -1;
  setVersesBeforeAndAfterCurrentVerse({
    beforeCurrentVerse:
      indexOfVerseBeforeSelectedVerse != -1
        ? originalVerse[indexOfVerseBeforeSelectedVerse]
        : null,
    afterCurrentVerse:
      indexOfVerseAfterSelectedVerse != -1
        ? originalVerse[indexOfVerseAfterSelectedVerse]
        : null,
  });
};

export default handleVersesBeforeAndAfterCurrentVerse;
