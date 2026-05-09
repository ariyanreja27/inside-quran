import {
  ColorValue,
  GestureResponderEvent,
  I18nManager,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import {ISelectedVerseLocation, ISurahVerse, IVerseWord} from '../../types';
import {COLORS} from '../../common';
import {usePageFontFileController} from '../../hooks';
import {getChapterCodeV1} from '../../helpers';
interface IProps {
  item: ISurahVerse;
  isCentered: boolean;
  selectedVerse: ISurahVerse;
  seSelectedVerse: (value: ISurahVerse) => void;
  setSelectedVerseLocation: (value: ISelectedVerseLocation) => void;
  selectionColor?: ColorValue;
  pageNumber: number | undefined;
}
const VerseLinesWordsList = ({
  item,
  isCentered,
  seSelectedVerse,
  selectedVerse,
  setSelectedVerseLocation,
  selectionColor,
  pageNumber,
}: IProps) => {
  const {_fontFileFormatGenerator} = usePageFontFileController();

  const verseWordSelected = (
    event: GestureResponderEvent,
    item: IVerseWord,
  ) => {
    const {pageY, pageX} = event.nativeEvent;
    const chapterCodeV1 = getChapterCodeV1(item?.verseData?.chapter_id);
    seSelectedVerse({
      ...item?.verseData,
      chapter_code_v1: chapterCodeV1,
      verse_font_famliy: pageNumber ? _fontFileFormatGenerator(pageNumber) : '',
    });
    setSelectedVerseLocation({
      itemLocationY: pageY,
      itemLocationX: pageX,
    });
  };
  return (
    <View
      style={{
        flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse',
        justifyContent: isCentered ? undefined : 'space-between',
        alignItems: 'center',
        width: '85%',
        alignSelf: 'center',
      }}>
      {item?.words?.map(innerItem => {
        // isVerseNumber: refers to ayah number form in mushaf
        const isVerseNumber = innerItem?.char_type_name == 'end';
        const isWordVerseSelected =
          innerItem?.verseData?.id == selectedVerse?.id && !isVerseNumber;

        return (
          <TouchableOpacity
            activeOpacity={1}
            key={`${innerItem?.id}`}
            onPress={event => {
              verseWordSelected(event, innerItem);
            }}>
            <Text
              adjustsFontSizeToFit
              style={{
                fontFamily: _fontFileFormatGenerator(innerItem?.page_number),
                fontSize: isCentered ? 35 : RFValue(16),
                backgroundColor: isWordVerseSelected
                  ? selectionColor ?? COLORS.light
                  : 'transparent',
              }}>
              {innerItem?.code_v1}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default VerseLinesWordsList;
