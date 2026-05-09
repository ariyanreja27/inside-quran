import {ActivityIndicator, I18nManager, Text, View} from 'react-native';
import {COLORS} from '../../common';

const Loader = ({
  chapterProgress,
  showTxt,
}: {
  chapterProgress?: number;
  showTxt?: boolean;
}) => {
  const txt =
    chapterProgress && chapterProgress < 100
      ? I18nManager.isRTL
        ? 'جاري تحميل ملقات السورة'
        : 'Downloading the chapter files'
      : I18nManager.isRTL
      ? 'جاري تحميل خطوط السورة'
      : 'Downloading the chapter fonts';
  const chapterProgressCondition = chapterProgress
    ? chapterProgress > 0 && chapterProgress != 100
    : false;
  return (
    <View style={{alignItems: 'center', justifyContent: 'center'}}>
      <ActivityIndicator color={COLORS.lightBackground} size={25} />
      <Text style={{marginTop: 5}}>
        {showTxt && txt}
        {chapterProgressCondition && `(${chapterProgress}%)`}
      </Text>
    </View>
  );
};

export default Loader;
