import {Image, ImageSourcePropType, StyleSheet, Text, View} from 'react-native';
import {FONT_FAMILY} from '../common';
import {_renderChapterName} from '../helpers';
interface IProps {
  chapterId: number;
  surahNameFrameImage: ImageSourcePropType;
}

const QuranChapterHeader = ({chapterId, surahNameFrameImage}: IProps) => {
  return (
    <View style={styles.surahNameContainer}>
      <Image
        source={surahNameFrameImage}
        style={styles.surahName}
        resizeMode="contain"
      />
      <View style={styles.row}>
        <Text style={styles.txt}>{_renderChapterName(chapterId)}</Text>
      </View>
    </View>
  );
};

export default QuranChapterHeader;

const styles = StyleSheet.create({
  surahNameContainer: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  surahName: {
    width: '100%',
    height: 50,
  },
  txt: {
    fontFamily: FONT_FAMILY.BISMLLAH,
    fontSize: 30,
  },
  row: {
    top: 1,
    position: 'absolute',
  },
  juzNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
