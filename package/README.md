# Package Title

react-native-quran-hafs

# Package description

It's a simple package allowing you to display the quran as mushaf

## Features

- Display the quran like mushaf.
- Selected a single verse to copy or bookmark it.
- Use this method [_renderChapterName(chapterId)] to render the surah name like mushaf.
- Use this method [_renderChapterAyahs(chapterId)] to render the number of surah verses(Ayahs).
- Scroll to a specific verse(Ayah) page.
- Support RTL Or LTR.

<!-- ![Screenshot](./screenshots/1.png) -->
<picture>
<img src="https://github.com/mohamedshawky982/react-native-quran-hafs/blob/master/screenshots/1.png" width="30%" height="20%" />
</picture>
<picture>
<img src="https://github.com/mohamedshawky982/react-native-quran-hafs/blob/master/screenshots/2.png" width="30%" height="20%" />
</picture>
<picture>
<img src="https://github.com/mohamedshawky982/react-native-quran-hafs/blob/master/screenshots/3.png" width="30%" height="20%" />
</picture>
<picture>
<img src="https://github.com/mohamedshawky982/react-native-quran-hafs/blob/master/screenshots/4.png" width="30%" height="20%" />
</picture>
<picture>
<img src="https://github.com/mohamedshawky982/react-native-quran-hafs/blob/master/screenshots/5.png" width="30%" height="20%" />
</picture>

## Preinstallation

- Install this font family [QCF_BSML](https://github.com/quran/quran.com-images/blob/master/res/fonts/QCF_BSML.TTF) and change its extention to be .ttf not .TTF

- install these packages:

  - @react-native-clipboard/clipboard.
  - @react-native-community/slider.
  - axios.
  - react-native-dynamic-fonts.
  - react-native-fs.
  - react-native-responsive-fontsize.
  - react-native-track-player.

- Upload the [fonts](https://github.com/quran/quran.com-images/tree/master/res/fonts) files as it is to you server so it can be easily downloaded

- The fonts url example https://your-domain/fonts/

## How to install and run

```bash
npm install react-native-quran-hafs
cd ios
pod install
cd ..
npm run ios
```

## Apis

| Option                    | Description                                                                           | Type                         | Required |
| ------------------------- | ------------------------------------------------------------------------------------- | ---------------------------- | -------- |
| chapterId                 | The surah or juz id                                                                   | number                       | true     |
| type                      | It's a type of what you want to display (surah or juz)                                | QuranTypesEnums              | true     |
| QURAN_FONTS_API           | Fonts url uploaded to your server                                                     | string                       | true     |
| backgroundImage           | The background of mushaf screen                                                       | ImageSourcePropType          | false    |
| surahNameFrameImage       | The frame of surah name                                                               | ImageSourcePropType          | false    |
| onBookMarkedVerse         | Callback funtion that return verse as ISurahVerse                                     | (verse: ISurahVerse) => void | false    |
| selectedBookedMarkedVerse | The verse object returned by onBookMarkedVerse function to scroll to passed ayah page | ISurahVerse                  | false    |
| resizeImageBackgroundMode | It's a resize mode of mushaf background image                                         | ImageResizeMode              | false    |
| selectionColor            | It's a color when select a specific ayah                                              | ColorValue                   | false    |

## Usage Example

```bash
import {QuranPageLayout, QuranTypesEnums} from 'react-native-quran-hafs';
const App = () => {
  return (
    <QuranPageLayout
      chapterId={1}
      type={QuranTypesEnums.chapter} // QuranTypesEnums.juz
      QURAN_FONTS_API="https://your-domain/fonts/"
      onBookMarkedVerse={verse => console.log(verse)}
    />
  );
};
export default App;
```

## How to:

- Automatic scrolling to specific verse:

```bash
<QuranPageLayout
      chapterId={67}
      type={QuranTypesEnums.chapter}
      QURAN_FONTS_API="https://your-domain/fonts/"
      selectedBookedMarkedVerse={{
        chapter_code_v1: 194,
        chapter_id: 67,
        id: 5263,
        page_number: 563,
        text_uthmani:
          'أَفَمَن يَمْشِى مُكِبًّا عَلَىٰ وَجْهِهِۦٓ أَهْدَىٰٓ أَمَّن يَمْشِى سَوِيًّا عَلَىٰ صِرَٰطٍ مُّسْتَقِيمٍ',
        verse_font_famliy: 'QCF_P563',
        verse_key: '67:22',
        verse_number: 22,
      }}
      onBookMarkedVerse={verse => {
        console.log(verse);
      }}
    />
```

![Gif](https://github.com/mohamedshawky982/react-native-quran-hafs/blob/master/videos/1.gif)
