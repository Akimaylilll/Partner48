import { app, BrowserWindow } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import { MainWin } from './win/MainWin';
import log  from 'electron-log';
import { MainBrowserWin } from "./types/index";
import { Tools } from "./utils/index";

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: MainBrowserWin | null = null
// Here, you can also use other preload

async function createWindow() {
  const mainWin = new MainWin();
  win = mainWin.getWin();
}

app.whenReady().then(createWindow)

app.on('window-all-closed', async () => {
  win = null;
  app.quit();
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('gpu-process-crashed', (event, kill) => {
  log.warn('app:gpu-process-crashed', event, kill);
});

app.on('renderer-process-crashed', (event, webContents, kill) => {
  log.warn('app:renderer-process-crashed', event, webContents, kill);
});

app.on('render-process-gone', (event, webContents, details) => {
  log.warn('app:render-process-gone', event, webContents, details);
});

app.on('child-process-gone', (event, details) => {
  log.warn('app:child-process-gone', event, details);
});