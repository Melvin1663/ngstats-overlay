module.exports = {
  packagerConfig: {
    icon: "./src/resources/assets/icons/app.ico",
    extraResource: [
      "./src/resources/assets"
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: 'Melvin#5155',
        description: 'Stats Overlay for NetherGames'
      },
    }
  ],
};
