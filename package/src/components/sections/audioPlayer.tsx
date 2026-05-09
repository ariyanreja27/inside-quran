import {forwardRef, useEffect, useImperativeHandle, useState} from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import TrackPlayer, {useProgress} from 'react-native-track-player';
import {
  IReciter,
  ISurahVerse,
  IVersesBeforeAndAfterCurrentVerse,
} from '../../types';
import {COLORS, IMAGES} from '../../common';
import {useAudioPlayerController} from '../../hooks';
import {RecitersModal} from '../modals';
import AudioPlayerControls from './audioPlayerControls';
import Slider from '@react-native-community/slider';
interface IProps {
  allReciter: IReciter[];
  setSelectedVerse: (verse: ISurahVerse) => void;
  chapterId: number;
  selectedVerse: ISurahVerse;
  versesBeforeAndAfterCurrentVerse: IVersesBeforeAndAfterCurrentVerse;
  setVersesBeforeAndAfterCurrentVerse: (
    value: IVersesBeforeAndAfterCurrentVerse,
  ) => void;
  originalVerse: ISurahVerse[];
  showSlider?: boolean;
  autoCompleteAudioAfterPlayingVerse?: boolean;
}
const {height} = Dimensions.get('screen');
const AudioPlayer = (props: IProps, ref: any) => {
  const {
    allReciter,
    setSelectedVerse,
    chapterId,
    selectedVerse,
    versesBeforeAndAfterCurrentVerse,
    setVersesBeforeAndAfterCurrentVerse,
    originalVerse,
    showSlider,
    autoCompleteAudioAfterPlayingVerse,
  } = props;
  const [selectedReciter, setSelectedReciter] = useState<IReciter>();
  const {duration, position} = useProgress();
  const {
    changeHandler,
    renderplayPauseBtn,
    onPlayPause,
    openReciterModal,
    recitersModalRef,
    formatTime,
  } = useAudioPlayerController();
  const [showPlayer, setShowPlayer] = useState(false);
  useImperativeHandle(ref, () => ({
    async setShowPlayerHandler(value: boolean) {
      // if (value === false) await TrackPlayer?.reset();
      setShowPlayer(value);
    },
    isPlayerShown() {
      return showPlayer;
    },
    _renderSelelctedReciter() {
      return selectedReciter;
    },
  }));
  useEffect(() => {
    if (allReciter?.length > 0) setSelectedReciter(allReciter[0]);
  }, [allReciter]);
  const closeAudioPlayer = async () => {
    setShowPlayer(false);
    await TrackPlayer.pause();
    setSelectedVerse({} as ISurahVerse);
  };
  return (
    showPlayer && (
      <View style={styles.container}>
        <View style={styles.closeContainer}>
          <TouchableOpacity
            onPress={closeAudioPlayer}
            style={[{backgroundColor: COLORS.white, borderRadius: 10}]}>
            <Image source={IMAGES.close} style={styles.closeIcon} />
          </TouchableOpacity>
        </View>
        {showSlider && (
          <Slider
            minimumValue={0}
            maximumValue={duration}
            value={position}
            minimumTrackTintColor={COLORS.darkBlack}
            maximumTrackTintColor={COLORS.light}
            thumbTintColor={COLORS.lighBlack}
            onSlidingComplete={changeHandler}
          />
        )}
        <View style={styles.row}>
          <View style={{flex: 1}}>
            <Text>
              {formatTime(position)} / {formatTime(duration)}
            </Text>
          </View>
          <View style={styles.controlersContainer}>
            <AudioPlayerControls
              onPlayPause={onPlayPause}
              renderplayPauseBtn={renderplayPauseBtn}
              versesBeforeAndAfterCurrentVerse={
                versesBeforeAndAfterCurrentVerse
              }
              setVersesBeforeAndAfterCurrentVerse={
                setVersesBeforeAndAfterCurrentVerse
              }
              selectedReciter={selectedReciter as IReciter}
              setSelectedVerse={setSelectedVerse}
              selectedVerse={selectedVerse}
              originalVerse={originalVerse}
              autoCompleteAudioAfterPlayingVerse={
                autoCompleteAudioAfterPlayingVerse
              }
            />
          </View>

          <TouchableOpacity
            onPress={openReciterModal}
            style={styles.recitersBtn}>
            <Text numberOfLines={1}>{selectedReciter?.name}</Text>
            <Image source={IMAGES.arrowDown} style={styles.closeIcon} />
          </TouchableOpacity>
        </View>
        <RecitersModal
          ref={recitersModalRef}
          allReciter={allReciter}
          selectedReciter={selectedReciter}
          setSelectedReciter={setSelectedReciter}
          chapterId={chapterId}
          selectedVerse={selectedVerse}
          autoCompleteAudioAfterPlayingVerse={
            autoCompleteAudioAfterPlayingVerse
          }
        />
      </View>
    )
  );
};

export default forwardRef(AudioPlayer);

const styles = StyleSheet.create({
  container: {
    width: '90%',
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 10,
    borderRadius: 10,
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  controlersContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeContainer: {
    width: '100%',
    alignItems: 'flex-start',
    position: 'absolute',
    top: -20,
    left: 0,
  },
  closeIcon: {width: 25, height: 25},
  recitersBtn: {
    flex: 1,
    paddingHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
