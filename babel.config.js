module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    // ✅ worklets-core는 위쪽에
    ['react-native-worklets-core/plugin'],

    // ✅ Reanimated는 반드시 마지막
    'react-native-reanimated/plugin',
  ],
};
