import React, {useRef, useState} from 'react';
import {
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ALFATIHA_CHAPTER_ID,
  ALTAWBA_CHAPTER_ID,
  COLORS,
  FONT_FAMILY,
  IMAGES,
} from '../../common';
import {_renderChapterName} from '../../helpers';
import {BismillahText, QuranPageHeader} from '../../layouts';
import {
  IModalRef,
  IPageVersesList,
  ISelectedVerseLocation,
  QuranTypesEnums,
} from '../../types';
import {
  handleVersesBeforeAndAfterCurrentVerse,
  hp,
  verticalScale,
} from '../../utils';
import {OptionsModal} from '../modals';
import VerseLinesWordsList from './verseLinesWordsList';
const {width} = Dimensions.get('window');

const PageVersesList = (props: IPageVersesList) => {
  const {
    pageVersesToDisplay,
    audioPlayerRef,
    selectedVerse,
    setSelectedVerse,
    onContainerPress,
    showBismllah,
    pageNumber,
    juzNumber,
    setVersesBeforeAndAfterCurrentVerse,
    originalVerse,
    onBookMarkedVerse,
    backgroundImage,
    chapterId,
    quranPageContainerStyle,
    resizeImageBackgroundMode,
    showChapterName,
    selectionColor,
    autoCompleteAudioAfterPlayingVerse,
    type,
    surahNameFrameImage,
  } = props;
  const optionsModalRef = useRef<IModalRef>();
  const [selectedVerseLocation, setSelectedVerseLocation] =
    useState<ISelectedVerseLocation>();

  const onVersePress = (location: ISelectedVerseLocation) => {
    optionsModalRef?.current?.openModal();
    setSelectedVerseLocation(location);
  };
  const closeOptionsModal = () => {
    optionsModalRef?.current?.closeModal();
  };
  const handlePlayPress = () => {
    closeOptionsModal();
    audioPlayerRef?.current?.setShowPlayerHandler(true);
    handleVersesBeforeAndAfterCurrentVerse({
      selectedVerse,
      setVersesBeforeAndAfterCurrentVerse,
      originalVerse,
    });
  };
  const pageLinesCount = pageVersesToDisplay?.length;
  return (
    <View style={styles.containerView}>
      <ImageBackground
        source={backgroundImage ?? IMAGES.mushafFrame}
        style={[{height: '100%', width: '100%'}, quranPageContainerStyle]}
        resizeMode={resizeImageBackgroundMode ?? 'cover'}>
        <TouchableOpacity
          style={styles.containerBtn}
          activeOpacity={1}
          onPress={onContainerPress}>
          <View
            style={{
              marginTop: 10,
            }}
          />
          {pageVersesToDisplay?.map(item => (
            <React.Fragment key={`${item?.lineNumber}`}>
              {item?.isFirstLine && (
                <QuranPageHeader
                  chapterId={item?.chapter_id}
                  surahNameFrameImage={
                    surahNameFrameImage ?? IMAGES.surahNameFrame
                  }
                />
              )}
              {item?.isFirstLine &&
                item?.chapter_id != ALTAWBA_CHAPTER_ID &&
                item?.chapter_id != ALFATIHA_CHAPTER_ID && <BismillahText />}
              <View
                style={{flex: pageLinesCount && pageLinesCount >= 10 ? 1 : 0}}>
                <VerseLinesWordsList
                  isCentered={
                    item?.page_number === 1 || item?.page_number === 2
                  }
                  item={item as any}
                  selectedVerse={selectedVerse}
                  seSelectedVerse={setSelectedVerse}
                  setSelectedVerseLocation={onVersePress}
                  selectionColor={selectionColor}
                  pageNumber={item?.page_number}
                />
              </View>
            </React.Fragment>
          ))}
          <OptionsModal
            ref={optionsModalRef}
            selectedVerseLocation={selectedVerseLocation}
            selectedVerse={selectedVerse}
            seSelectedVerse={setSelectedVerse}
            handlePlayPress={handlePlayPress}
            selectedReciter={audioPlayerRef?.current?._renderSelelctedReciter()}
            onBookMarkedVerse={onBookMarkedVerse}
            chapterId={chapterId}
            autoCompleteAudioAfterPlayingVerse={
              autoCompleteAudioAfterPlayingVerse
            }
          />

          <View style={styles.pageNumberContainer}>
            <View style={styles.pageNumberView}>
              <Text style={styles.txt}>{pageNumber}</Text>
            </View>
          </View>
          <View style={styles.juzNumberContainer}>
            <View style={styles.juzNumberCircle}>
              <Text style={styles.txt}>الجزء {juzNumber}</Text>
            </View>
            {(!showChapterName || type === QuranTypesEnums.juz) && (
              <View style={styles.juzNumberCircle}>
                <Text style={[styles.txt, {fontFamily: FONT_FAMILY.BISMLLAH}]}>
                  {_renderChapterName(chapterId)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );
};
export default PageVersesList;

const styles = StyleSheet.create({
  containerView: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  pageNumberView: {
    width: 40,
    height: 40,
    borderRadius: 40 / 2,
    backgroundColor: COLORS.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberContainer: {
    position: 'absolute',
    bottom: verticalScale(10),
    right: 0,
    width: '100%',
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surahNameContainer: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: hp('2%'),
  },
  juzNumberContainer: {
    position: 'absolute',
    width: '100%',
    top: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  juzNumberCircle: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.light,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  txt: {fontFamily: FONT_FAMILY.CAIRO, fontSize: 15},
  containerBtn: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: hp('2%'),
    paddingBottom: hp('5%'),
  },
  mushafFrameImage: {
    height: '100%',
    width: '100%',
    position: 'absolute',
    zIndex: -2,
    alignSelf: 'center',
  },
});
