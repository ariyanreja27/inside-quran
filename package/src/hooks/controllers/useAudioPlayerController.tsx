import {ActivityIndicator, Image, StyleSheet} from 'react-native';
import TrackPlayer from 'react-native-track-player';
import {IMAGES} from '../../common';
import {usePlaybackState, State} from 'react-native-track-player';
import {IModalRef} from '../../types';
import {useRef} from 'react';

const useAudioPlayerController = () => {
  const recitersModalRef = useRef<IModalRef>();

  const playbackState = usePlaybackState();
  const changeHandler = (val: number) => {
    TrackPlayer.seekTo(val);
  };
  const renderplayPauseBtn = () => {
    switch (playbackState?.state) {
      case State?.Playing as any:
        return <Image source={IMAGES.pause} style={styles.img} />;
      case State?.Ready as any:
        return <Image source={IMAGES.playIcon} style={styles.img} />;
      case State.Paused as any:
        return <Image source={IMAGES.playIcon} style={styles.img} />;
      default:
        return <ActivityIndicator size={30} color="#2B3F4B" />;
    }
  };
  const onPlayPause = async () => {
    if (playbackState?.state === State.Playing) {
      TrackPlayer.pause();
    } else if (
      playbackState?.state === State.Paused ||
      playbackState?.state === State.Ready
    ) {
      TrackPlayer.play();
    } else {
      TrackPlayer.reset();
    }
  };
  const openReciterModal = () => {
    recitersModalRef?.current?.openModal();
  };
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    let seconds: any = Math.ceil(secs % 60);
    if (seconds < 10) seconds = `0${seconds}`;
    return `${hours}:${minutes}:${seconds}`;
  };

  return {
    changeHandler,
    renderplayPauseBtn,
    onPlayPause,
    openReciterModal,
    recitersModalRef,
    formatTime,
  };
};

export default useAudioPlayerController;
const styles = StyleSheet.create({
  img: {width: 20, height: 20},
});
