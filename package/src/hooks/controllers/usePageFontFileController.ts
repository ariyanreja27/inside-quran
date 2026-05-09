import RNFS from 'react-native-fs';
import {loadFont} from 'react-native-dynamic-fonts';
import {isFileExists} from '../../utils';

const _renderPageNumber = (pageNumber: number) => {
  let pageNumberFormat = '';
  if (pageNumber < 10) pageNumberFormat = `00${pageNumber}`;
  else if (pageNumber >= 10 && pageNumber < 100)
    pageNumberFormat = `0${pageNumber}`;
  else pageNumberFormat = `${pageNumber}`;
  return pageNumberFormat;
};

const _fontFileFormatGenerator = (currentPageNumber: number) =>
  `QCF_P${_renderPageNumber(currentPageNumber)}`;
const _filePathFormatGenerator = (targetFont: string) =>
  RNFS.DocumentDirectoryPath + `/${targetFont}.ttf`;

const isFontFileExistsBefore = async (currentPageNumber: number) => {
  const targetFont = _fontFileFormatGenerator(currentPageNumber);
  const fontFilePath = _filePathFormatGenerator(targetFont);
  return await isFileExists(fontFilePath);
};

export const downoladThePageFont = async (
  currentPageNumber: number,
  onFontLoaded: () => void,
  quranFontApi: string,
) => {
  if (!quranFontApi) throw new Error('you must add fonts link');

  const targetFont = _fontFileFormatGenerator(currentPageNumber);
  const url = `${quranFontApi}${targetFont}.TTF`;
  const filePath = _filePathFormatGenerator(targetFont);
  const ifFileSavedBefore = await isFileExists(filePath);
  if (ifFileSavedBefore) {
    loadFontFamily(filePath, targetFont, onFontLoaded);
  } else
    return RNFS.downloadFile({
      fromUrl: url,
      toFile: filePath,
      background: true, // Enable downloading in the background (iOS only)
      discretionary: true, // Allow the OS to control the timing and speed (iOS only)
      progress: res => {
        // Handle download progress updates if needed
        const progress = (res.bytesWritten / res.contentLength) * 100;
      },
    })
      .promise.then(res => {
        console.log('res' + `${targetFont}`, JSON.stringify(res));
        return loadFontFamily(filePath, targetFont, onFontLoaded);
      })
      .catch(err => {
        console.log('Download error:', err);
        return err;
      });
};
const loadFontFamily = async (
  fontFilePath: string,
  targetFont: string,
  onFontLoaded: () => void,
) => {
  const base64 = await RNFS.readFile(fontFilePath, {encoding: 'base64'});
  return loadFont(targetFont, base64, 'ttf').then((name: string) => {
    console.log('Loaded font successfully. Font name is: ', name);
    onFontLoaded();
    return name;
  });
};

const usePageFontFileController = () => {
  return {downoladThePageFont, _fontFileFormatGenerator};
};

export default usePageFontFileController;
