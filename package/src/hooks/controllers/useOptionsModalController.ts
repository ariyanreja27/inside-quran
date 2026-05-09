import Clipboard from '@react-native-clipboard/clipboard';
import {Dimensions, I18nManager} from 'react-native';
import {IReciter, ISelectedVerseLocation, ISurahVerse} from '../../types';
import {useGetChapterAudio} from '../apis';
import TrackPlayer from 'react-native-track-player';

const OPTION_CONTAINER_WIDTH = 130;
const OPTION_CONTAINER_HEIGHT = 50;
const {width} = Dimensions.get('screen');
interface IProps {
  selectedVerseLocation: ISelectedVerseLocation | undefined;
  selectedVerse: ISurahVerse;
  selectedReciter: IReciter | undefined;
  handlePlayPress: () => void;
  setIsVisible: (value: boolean) => void;
  seSelectedVerse: (value: ISurahVerse) => void;
}
const useOptionsModalController = ({
  selectedVerseLocation,
  selectedVerse,
  setIsVisible,
  seSelectedVerse,
}: IProps) => {
  const {getVerseAudio, isVersePositionLoading, getChapterAudionUrl} =
    useGetChapterAudio();

  const onPlayerPress = async ({
    reciterId,
    handlePlayPress,
    verse_key,
    chapterId,
    autoCompleteAudioAfterPlayingVerse,
  }: {
    reciterId: number;
    verse_key: string;
    handlePlayPress?: () => void;
    chapterId: number;
    autoCompleteAudioAfterPlayingVerse?: boolean;
  }) => {
    const trackData = await TrackPlayer.getActiveTrack();
    if (trackData?.chapter_id != chapterId) {
      await TrackPlayer.pause();
      await getChapterAudionUrl({
        reciterId: reciterId,
        chapterId,
        verse_key: selectedVerse?.verse_key,
        autoCompleteAudioAfterPlayingVerse,
        callback: handlePlayPress,
      });
      return;
    }
    getVerseAudio(
      reciterId as number,
      verse_key,
      handlePlayPress,
      autoCompleteAudioAfterPlayingVerse,
    );
  };
  const copyVerseToClipBoard = () => {
    Clipboard?.setString(selectedVerse?.text_uthmani);
    console.log('copied');
  };
  const _renderOptionContainerPosition = ():
    | {
        translateY: number;
        translateX: number;
      }
    | undefined => {
    if (selectedVerseLocation)
      return {
        translateX:
          selectedVerseLocation?.itemLocationX + OPTION_CONTAINER_WIDTH < width
            ? I18nManager.isRTL
              ? -selectedVerseLocation?.itemLocationX
              : selectedVerseLocation?.itemLocationX
            : I18nManager.isRTL
            ? -(selectedVerseLocation?.itemLocationX - 100)
            : selectedVerseLocation?.itemLocationX - 100,
        translateY:
          selectedVerseLocation?.itemLocationY + OPTION_CONTAINER_HEIGHT < width
            ? selectedVerseLocation?.itemLocationY
            : selectedVerseLocation?.itemLocationY - 100,
      };
  };
  const onRequestClose = () => {
    setIsVisible(false);
    seSelectedVerse({} as ISurahVerse);
  };
  return {
    _renderOptionContainerPosition,
    OPTION_CONTAINER_WIDTH,
    copyVerseToClipBoard,
    onPlayerPress,
    onRequestClose,
    isVersePositionLoading,
  };
};

export default useOptionsModalController;
