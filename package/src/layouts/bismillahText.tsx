import {Text, View} from 'react-native';
import {FONT_FAMILY, basmalah} from '../common';

const BismillahText = () => {
  return (
    <View
      style={{
        width: '90%',
        alignItems: 'center',
      }}>
      <Text style={{fontFamily: FONT_FAMILY.BISMLLAH, fontSize: 25}}>
        {basmalah}
      </Text>
    </View>
  );
};

export default BismillahText;
