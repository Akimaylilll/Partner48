import { BrowserWindow } from 'electron';
export class AboutWin {
  public constructor() {
    const MSWin = new BrowserWindow({
      useContentSize: true,
      height: 800,
      width: 1200,
      resizable: true,
      show: true,
      webPreferences: {
        nodeIntegration: true,
        // 官网似乎说是默认false，但是这里必须设置contextIsolation
        contextIsolation: false
      }
    });
    MSWin.menuBarVisible = false;
    const url = process.env.VITE_DEV_SERVER_URL;
    if (process.env.VITE_DEV_SERVER_URL) {
      MSWin.loadURL("https://github.com/Akimaylilll/Partner48");
      // Open devTool if the app is not packaged
      MSWin.webContents.openDevTools();
    } else {
      MSWin.loadURL("https://github.com/Akimaylilll/Partner48");
    }
  }
}