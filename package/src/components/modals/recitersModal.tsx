import {forwardRef, useImperativeHandle, useState} from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {COLORS, IMAGES} from '../../common';
import {IReciter, ISurahVerse} from '../../types';
import {useGetChapterAudio} from '../../hooks';
const {height} = Dimensions.get('screen');
interface IProps {
  allReciter: IReciter[];
  selectedReciter: IReciter | undefined;
  setSelectedReciter: (value: IReciter) => void;
  chapterId: number;
  selectedVerse: ISurahVerse;
  autoCompleteAudioAfterPlayingVerse?: boolean;
}
const RecitersModal = (props: IProps, ref: any) => {
  const {
    allReciter,
    selectedReciter,
    setSelectedReciter,
    chapterId,
    selectedVerse,
    autoCompleteAudioAfterPlayingVerse,
  } = props;
  const [isVisible, setIsVisible] = useState(false);
  const {getChapterAudionUrl} = useGetChapterAudio();
  useImperativeHandle(ref, () => ({
    openModal() {
      setIsVisible(true);
    },
    closeModal() {
      setIsVisible(false);
    },
  }));
  const closeModal = () => {
    setIsVisible(false);
  };
  const onSelectReciter = (item: IReciter) => {
    getChapterAudionUrl({
      reciterId: item?.id,
      chapterId,
      verse_key: selectedVerse?.verse_key,
      autoCompleteAudioAfterPlayingVerse,
    });
    closeModal();
    setSelectedReciter(item);
  };
  return (
    <Modal visible={isVisible} transparent onRequestClose={closeModal}>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          <TouchableOpacity style={{flex: 1}} onPress={closeModal} />
          <View style={styles.smallContainer}>
            <TouchableOpacity style={styles.closeIconBtn} onPress={closeModal}>
              <Image source={IMAGES.close} style={styles.closeIcon} />
            </TouchableOpacity>
            <FlatList
              data={allReciter}
              renderItem={({item}) => (
                <TouchableOpacity
                  onPress={() => onSelectReciter(item)}
                  style={[
                    styles.content,
                    {
                      backgroundColor:
                        selectedReciter?.id === item?.id
                          ? COLORS.light
                          : 'white',
                    },
                  ]}>
                  <Text>{item?.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default forwardRef(RecitersModal);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
    justifyContent: 'flex-end',
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    alignItems: 'flex-start',
    padding: 15,
    borderColor: COLORS.light,
    borderWidth: 1,
    borderRadius: 10,
    marginVertical: 5,
  },
  smallContainer: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: 'white',
    padding: 10,
    maxHeight: height - 300,
  },
  closeIconBtn: {alignSelf: 'flex-end', marginVertical: 5},
  closeIcon: {width: 25, height: 25},
});
