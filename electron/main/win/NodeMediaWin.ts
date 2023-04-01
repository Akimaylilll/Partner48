import { BrowserWindow } from 'electron';
export class NodeMediaWin {
  public constructor() {
    const MSWin = new BrowserWindow({
      useContentSize: true,
      height: 500,
      width: 1500,
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
      MSWin.loadURL("http://127.0.0.1:8936/admin");
      // Open devTool if the app is not packaged
      MSWin.webContents.openDevTools();
    } else {
      MSWin.loadURL("http://127.0.0.1:8936/admin");
    }
  }
}