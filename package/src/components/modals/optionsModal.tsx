import {forwardRef, useImperativeHandle, useState} from 'react';
import {
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {IOptionsModal} from '../../types';
import {COLORS} from '../../common';
import IMAGES from '../../common/images';
import {useOptionsModalController} from '../../hooks';
import {Loader} from '../sections';

const OptionsModal = (props: IOptionsModal, ref: any) => {
  const {
    selectedVerseLocation,
    selectedVerse,
    seSelectedVerse,
    handlePlayPress,
    selectedReciter,
    onBookMarkedVerse,
    chapterId,
    autoCompleteAudioAfterPlayingVerse,
  } = props;
  const [isVisible, setIsVisible] = useState(false);

  const {
    _renderOptionContainerPosition,
    OPTION_CONTAINER_WIDTH,
    onPlayerPress,
    copyVerseToClipBoard,
    onRequestClose,
    isVersePositionLoading,
  } = useOptionsModalController({
    selectedVerseLocation,
    selectedVerse,
    selectedReciter,
    handlePlayPress,
    setIsVisible,
    seSelectedVerse,
  });
  const closeModal = () => {
    setIsVisible(false);
  };
  useImperativeHandle(ref, () => ({
    openModal() {
      setIsVisible(true);
    },
    closeModal() {
      closeModal();
    },
  }));

  const transform = [
    {translateY: _renderOptionContainerPosition()?.translateY},
    {
      translateX: _renderOptionContainerPosition()?.translateX,
    },
  ];

  return (
    <Modal visible={isVisible} transparent onRequestClose={onRequestClose}>
      <SafeAreaView style={{flex: 1}}>
        <TouchableOpacity
          onPress={onRequestClose}
          style={{flex: 1, backgroundColor: COLORS.lightBackground}}>
          <View
            style={[
              styles.optionViewContainer,
              {
                width: OPTION_CONTAINER_WIDTH,
                transform,
                height: 50,
              } as any,
            ]}>
            <TouchableOpacity
              onPress={() =>
                onPlayerPress({
                  reciterId: selectedReciter?.id as number,
                  verse_key: selectedVerse?.verse_key,
                  handlePlayPress,
                  chapterId,
                  autoCompleteAudioAfterPlayingVerse,
                })
              }>
              {isVersePositionLoading ? (
                <Loader />
              ) : (
                <Image source={IMAGES.playIcon} style={styles.icon} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={copyVerseToClipBoard}>
              <Image source={IMAGES.copyIcon} style={styles.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (onBookMarkedVerse) onBookMarkedVerse(selectedVerse);
                closeModal();
              }}>
              <Image source={IMAGES.bookmark} style={styles.icon} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

export default forwardRef(OptionsModal);

const styles = StyleSheet.create({
  optionViewContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  icon: {
    width: 20,
    height: 20,
    marginLeft: 15,
  },
});
