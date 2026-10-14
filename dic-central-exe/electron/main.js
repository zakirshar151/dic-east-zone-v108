const { app, BrowserWindow, session, Menu, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');

let mainWindow = null;

function findAndClick(win, labels, purpose) {
  const script = `(() => {
    const labels = ${JSON.stringify(labels.map(s => s.toLowerCase()))};
    const normalize = value => String(value || '').replace(/[\\s\\u00a0]+/g, ' ').trim().toLowerCase();
    const candidates = [...document.querySelectorAll('button,a,[role="button"],[onclick],input[type="button"],input[type="submit"]')];
    const getLabel = el => normalize([el.innerText, el.value, el.getAttribute('aria-label'), el.title].filter(Boolean).join(' '));
    const el = candidates.find(node => {
      const text = getLabel(node);
      return labels.some(label => text === label || text.startsWith(label + ' ') || text.startsWith(label + ':'));
    });
    if (!el) return false;
    el.click();
    return true;
  })()`;
  win.webContents.executeJavaScript(script).then(found => {
    if (!found) dialog.showMessageBox(win, {
      type: 'info',
      title: 'DIC East Zone',
      message: purpose + ' button was not found on the current screen.',
      detail: 'Open the relevant DIC screen and try again. No case data was changed.'
    });
  }).catch(error => dialog.showErrorBox('DIC East Zone', String(error.message || error)));
}

async function openBackup(win) {
  const result = await dialog.showOpenDialog(win, {
    title: 'Open DIC Backup',
    properties: ['openFile'],
    filters: [{ name: 'DIC JSON Backup', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePaths.length) return;
  try {
    const filePath = result.filePaths[0];
    const base64 = (await fs.readFile(filePath)).toString('base64');
    const fileName = path.basename(filePath);
    const script = `(() => {
      const input = document.getElementById('dicMigrateFile');
      if (!input) return false;
      const binary = atob(${JSON.stringify(base64)});
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], ${JSON.stringify(fileName)}, { type: 'application/json' });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`;
    const found = await win.webContents.executeJavaScript(script);
    if (!found) {
      await dialog.showMessageBox(win, {
        type: 'info',
        title: 'Open DIC Backup',
        message: 'Backup import is not available until you sign in to Central Sync.',
        detail: 'Sign in first, then use File → Open again. Your selected file was not imported.'
      });
    }
  } catch (error) {
    dialog.showErrorBox('Open DIC Backup failed', String(error.message || error));
  }
}

function createAppMenu(win) {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => openBackup(win) },
        { type: 'separator' },
        { label: 'New Case', accelerator: 'CmdOrCtrl+N', click: () => findAndClick(win, ['new case', 'add case', 'new record', 'add record', 'new investigation', 'add investigation', 'add fir'], 'New Case') },
        { type: 'separator' },
        { label: 'Close', accelerator: 'CmdOrCtrl+W', click: () => win.close() },
        { label: 'Exit', accelerator: 'Alt+F4', click: () => win.close() }
      ]
    },
    { label: 'Edit', role: 'editMenu' },
    { label: 'View', role: 'viewMenu' },
    {
      label: 'District',
      submenu: [
        { label: 'District East', click: () => findAndClick(win, ['district east', 'east zone', 'east'], 'District East') },
        { label: 'District Malir', click: () => findAndClick(win, ['district malir', 'malir'], 'District Malir') },
        { label: 'District Korangi', click: () => findAndClick(win, ['district korangi', 'korangi'], 'District Korangi') }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', click: () => win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5) },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5) },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => win.webContents.setZoomLevel(0) },
        { type: 'separator' },
        { label: 'Reload Application', accelerator: 'CmdOrCtrl+R', click: () => win.webContents.reload() },
        { label: 'Toggle Full Screen', accelerator: 'F11', click: () => win.setFullScreen(!win.isFullScreen()) },
        { type: 'separator' },
        { label: 'About DIC East Zone', click: () => dialog.showMessageBox(win, { type: 'info', title: 'About DIC East Zone', message: 'DIC East Zone — Automatic Case Enrichment', detail: 'Central Windows desktop application. Use the Dashboard and district screens to manage authorized DIC work.' }) }
      ]
    },
    { label: 'Window', role: 'windowMenu' },
    {
      label: 'Help',
      submenu: [
        { label: 'About DIC East Zone', click: () => dialog.showMessageBox(win, { type: 'info', title: 'About DIC East Zone', message: 'DIC East Zone — Automatic Case Enrichment', detail: 'Use File → Open to import a JSON backup, District to navigate, and Settings to adjust the application view.' }) }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

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
  mainWindow = win;
  win.loadFile(path.join(__dirname, '..', 'index.html'));
  win.webContents.on('did-finish-load', async () => {
    try {
      const fixPath = path.join(__dirname, '..', 'src', 'dic-v19-ui-fixes.js');
      const fixScript = await fs.readFile(fixPath, 'utf8');
      await win.webContents.executeJavaScript(fixScript);
    } catch (error) {
      console.error('DIC UI fixes could not be loaded:', error);
    }
  });
  createAppMenu(win);
  win.on('closed', () => { if (mainWindow === win) mainWindow = null; });
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
