const { app, BrowserWindow, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.webContents.on('did-finish-load', () => {
    const featurePath = path.join(__dirname, '..', 'daily-register.js');
    win.webContents.executeJavaScript(
      "(function(){var s=document.createElement('script');s.src=" +
      JSON.stringify(pathToFileURL(featurePath).href) +
      ";s.onload=function(){var b=document.getElementById('dicRegLaunch');if(b)b.style.bottom='92px';};s.onerror=function(){console.error('DIC Daily Register module failed to load');};document.head.appendChild(s);})();"
    ).catch(err => console.error('DIC module injection failed:', err));
  });
  win.loadFile(path.join(__dirname, '..', 'index.html'));
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
