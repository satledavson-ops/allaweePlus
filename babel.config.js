module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    // … any other plugins you already have …
    [
      'module:react-native-dotenv', {
        "moduleName": "@env",
        "path": ".env",
        "blocklist": null,
        "allowlist": null,
        "safe": false,
        "allowUndefined": true,
        "verbose": false
      }
    ]
  ],
};
