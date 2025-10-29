// ✅ babel.config.js — versión correcta para Expo + NativeWind
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["nativewind/babel"],
  };
};
