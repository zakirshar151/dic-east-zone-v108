const { contextBridge, app } = require('electron');
contextBridge.exposeInMainWorld('dicDesktop', {
  platform: process.platform,
  appVersion: app.getVersion()
});