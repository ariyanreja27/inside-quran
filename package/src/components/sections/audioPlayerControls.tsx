import React from 'react';
import {I18nManager, Image, TouchableOpacity, View} from 'react-native';
import {IMAGES} from '../../common';
import {
  IReciter,
  ISurahVerse,
  IVersesBeforeAndAfterCurrentVerse,
} from '../../types';
import {useOptionsModalController} from '../../hooks';
import handleVersesBeforeAndAfterCurrentVerse from '../../utils/handleBeforeAndAfterCurrentVerse';
interface IProps {
  onPlayPause: () => void;
  renderplayPauseBtn: () => React.ReactNode;
  versesBeforeAndAfterCurrentVerse: IVersesBeforeAndAfterCurrentVerse;
  selectedReciter: IReciter;
  setSelectedVerse: (value: ISurahVerse) => void;
  selectedVerse: ISurahVerse;
  setVersesBeforeAndAfterCurrentVerse: (
    value: IVersesBeforeAndAfterCurrentVerse,
  ) => void;
  originalVerse: ISurahVerse[];
  autoCompleteAudioAfterPlayingVerse?: boolean;
}
const AudioPlayerControls = ({
  onPlayPause,
  renderplayPauseBtn,
  versesBeforeAndAfterCurrentVerse,
  selectedReciter,
  selectedVerse,
  setSelectedVerse,
  setVersesBeforeAndAfterCurrentVerse,
  autoCompleteAudioAfterPlayingVerse,
  originalVerse,
}: IProps) => {
  const {onPlayerPress} = useOptionsModalController({} as any);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      <TouchableOpacity
        style={{
          marginHorizontal: 12,
          transform: [{rotate: I18nManager.isRTL ? '0deg' : '180deg'}],
        }}
        onPress={() => {
          if (!versesBeforeAndAfterCurrentVerse?.beforeCurrentVerse) return;
          if (versesBeforeAndAfterCurrentVerse?.beforeCurrentVerse)
            setSelectedVerse(
              versesBeforeAndAfterCurrentVerse?.beforeCurrentVerse,
            );
          handleVersesBeforeAndAfterCurrentVerse({
            selectedVerse: versesBeforeAndAfterCurrentVerse?.beforeCurrentVerse,
            setVersesBeforeAndAfterCurrentVerse,
            originalVerse,
          });

          onPlayerPress({
            reciterId: selectedReciter?.id,
            verse_key:
              versesBeforeAndAfterCurrentVerse?.beforeCurrentVerse?.verse_key,
            chapterId: selectedVerse?.chapter_id,
            autoCompleteAudioAfterPlayingVerse,
          });
        }}>
        <Image source={IMAGES.playNext} style={{width: 20, height: 20}} />
      </TouchableOpacity>

      <TouchableOpacity style={{marginHorizontal: 12}} onPress={onPlayPause}>
        {renderplayPauseBtn()}
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          marginHorizontal: 12,
          transform: [{rotate: I18nManager.isRTL ? '180deg' : '0deg'}],
        }}
        onPress={() => {
          if (!versesBeforeAndAfterCurrentVerse?.afterCurrentVerse) return;
          onPlayerPress({
            reciterId: selectedReciter?.id,
            verse_key:
              versesBeforeAndAfterCurrentVerse?.afterCurrentVerse?.verse_key,
            chapterId: selectedVerse?.chapter_id,
            autoCompleteAudioAfterPlayingVerse,
          });
          setSelectedVerse(versesBeforeAndAfterCurrentVerse?.afterCurrentVerse);
          handleVersesBeforeAndAfterCurrentVerse({
            selectedVerse: versesBeforeAndAfterCurrentVerse?.afterCurrentVerse,
            setVersesBeforeAndAfterCurrentVerse,
            originalVerse,
          });
        }}>
        <Image source={IMAGES.playNext} style={{width: 20, height: 20}} />
      </TouchableOpacity>
    </View>
  );
};
export default AudioPlayerControls;
