import { BrowserWindow } from 'electron';
import { join } from 'node:path';
export class KeyWin {
  public constructor(win: BrowserWindow) {
    const KeyWin = new BrowserWindow({
      useContentSize: true,
      height: 200,
      width: 320,
      resizable: false,
      show: true,
      modal: true,//开启模态父子窗口
      parent: win,
      webPreferences: {
        nodeIntegration: true,
        // 官网似乎说是默认false，但是这里必须设置contextIsolation
        contextIsolation: false
      }
    });
    KeyWin.menuBarVisible = false;
    const url = process.env.VITE_DEV_SERVER_URL;
    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
      KeyWin.loadURL(url + '#/keyInput');
      // Open devTool if the app is not packaged
      KeyWin.webContents.openDevTools();
    } else {
      KeyWin.loadFile(join(process.env.DIST, 'index.html'), {
        hash: 'keyInput'
      });
    }
  }
}