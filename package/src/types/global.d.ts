declare module 'react-native-dynamic-fonts' {
  export const loadFont: (
    targetFont: string,
    base64: string,
    fontExtension: string,
  ) => Promise;
}
