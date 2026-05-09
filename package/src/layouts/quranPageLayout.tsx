import {useEffect, useMemo, useRef, useState} from 'react';
import {FlatList, I18nManager, SafeAreaView, View} from 'react-native';
import TrackPlayer from 'react-native-track-player';
import {
  IAudioPlayerRef,
  IChapterVerses,
  IQuranPageLayout,
  ISurahVerse,
  IVersesBeforeAndAfterCurrentVerse,
  QuranTypesEnums,
} from '../types';
import {AudioPlayer, Loader, PageVersesList} from '../components';
import {useGetChapterByPage, useGetChapterLookup} from '../hooks';
import useGetReciters from '../hooks/apis/useGetReciters';
import {ALFATIHA_CHAPTER_ID, ALTAWBA_CHAPTER_ID} from '../common';

const QuranPageLayout = ({
  chapterId = 1,
  type = QuranTypesEnums.chapter,
  QURAN_FONTS_API,
  showSlider,
  selectedBookedMarkedVerse,
  onBookMarkedVerse,
  backgroundImage,
  surahNameFrameImage,
  resizeImageBackgroundMode,
  quranPageContainerStyle,
  selectionColor,
  autoCompleteAudioAfterPlayingVerse,
}: IQuranPageLayout) => {
  const flatlistRef = useRef<any>();
  const {chapterLookUp} = useGetChapterLookup({
    chapterId,
    type,
  });
  const {chapterVerses, isLoading, chapterProgress} = useGetChapterByPage({
    chapterLookUp,
    chapterId,
    type,
    QURAN_FONTS_API: QURAN_FONTS_API,
  });
  const {allReciters} = useGetReciters({chapterId, type});
  const audioPlayerRef = useRef<IAudioPlayerRef>();
  const [selectedVerse, setSelectedVerse] = useState<ISurahVerse>(
    {} as ISurahVerse,
  );
  const [
    versesBeforeAndAfterCurrentVerse,
    setVersesBeforeAndAfterCurrentVerse,
  ] = useState<IVersesBeforeAndAfterCurrentVerse>(
    {} as IVersesBeforeAndAfterCurrentVerse,
  );
  const onContainerPress = () => {
    audioPlayerRef?.current?.setShowPlayerHandler(
      !audioPlayerRef?.current?.isPlayerShown(),
    );
  };
  const originalVerse = useMemo(
    () =>
      chapterVerses?.find(
        (item: IChapterVerses) =>
          item?.page_number == selectedVerse?.page_number,
      )?.originalVerses as ISurahVerse[],
    [selectedVerse],
  );

  useEffect(() => {
    TrackPlayer.setupPlayer();
  }, []);
  useEffect(() => {
    if (!isLoading && selectedBookedMarkedVerse) {
      setSelectedVerse(selectedBookedMarkedVerse);
      scrollToPageIndex();
    }
  }, [isLoading]);
  const scrollToPageIndex = () => {
    let selectedBookMarkedVerseIndex = chapterVerses?.findIndex(
      item => item?.page_number == selectedBookedMarkedVerse?.page_number,
    );
    selectedBookMarkedVerseIndex = I18nManager.isRTL
      ? chapterVerses?.length - 1 - selectedBookMarkedVerseIndex
      : selectedBookMarkedVerseIndex;
    setTimeout(() => {
      flatlistRef?.current?.scrollToIndex({
        index: selectedBookMarkedVerseIndex,
        animated: true,
      });
    }, 1000);
  };
  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        {isLoading ? (
          <Loader chapterProgress={chapterProgress} showTxt />
        ) : (
          <FlatList
            ref={flatlistRef}
            data={chapterVerses}
            contentContainerStyle={{
              alignItems: 'center',
              justifyContent: 'center',
            }}
            pagingEnabled
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({item, index}) => (
              <PageVersesList
                type={type}
                pageVersesToDisplay={item?.verses}
                audioPlayerRef={audioPlayerRef}
                selectedVerse={selectedVerse}
                setSelectedVerse={setSelectedVerse}
                setVersesBeforeAndAfterCurrentVerse={
                  setVersesBeforeAndAfterCurrentVerse
                }
                onContainerPress={onContainerPress}
                chapterId={item?.chapter_id}
                showChapterName={index === 0 || item?.isFirstChapterPage}
                showBismllah={
                  (item?.chapter_id != ALTAWBA_CHAPTER_ID &&
                    index === 0 &&
                    item?.chapter_id != ALFATIHA_CHAPTER_ID) ||
                  (item?.isFirstChapterPage &&
                    item?.chapter_id != ALTAWBA_CHAPTER_ID)
                }
                pageNumber={item?.page_number}
                juzNumber={item?.juz_number}
                originalVerse={item?.originalVerses}
                onBookMarkedVerse={onBookMarkedVerse}
                backgroundImage={backgroundImage}
                surahNameFrameImage={surahNameFrameImage}
                resizeImageBackgroundMode={resizeImageBackgroundMode}
                quranPageContainerStyle={quranPageContainerStyle}
                selectionColor={selectionColor}
                autoCompleteAudioAfterPlayingVerse={
                  autoCompleteAudioAfterPlayingVerse
                }
              />
            )}
            onScrollToIndexFailed={info => {
              // to handle if there is a failure when scrollToIndex
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatlistRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                });
              });
            }}
          />
        )}
        <AudioPlayer
          ref={audioPlayerRef}
          chapterId={selectedVerse?.chapter_id ?? chapterId}
          setSelectedVerse={setSelectedVerse}
          selectedVerse={selectedVerse}
          allReciter={allReciters}
          versesBeforeAndAfterCurrentVerse={versesBeforeAndAfterCurrentVerse}
          setVersesBeforeAndAfterCurrentVerse={
            setVersesBeforeAndAfterCurrentVerse
          }
          originalVerse={originalVerse}
          showSlider={showSlider}
          autoCompleteAudioAfterPlayingVerse={
            autoCompleteAudioAfterPlayingVerse
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default QuranPageLayout;
