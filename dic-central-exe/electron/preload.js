const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('dicDesktop', {
  platform: process.platform,
  appVersion: '1.0.0'
});