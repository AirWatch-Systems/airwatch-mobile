const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Exclude recharts from bundling since it's only used on web
config.resolver.blockList = [
  /recharts\/.*/,
  ...(config.resolver.blockList || []),
];

// Platform-specific extensions for web compatibility
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

module.exports = config;