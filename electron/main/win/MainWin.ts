import { app, BrowserWindow, shell, Menu, ipcMain } from 'electron'
import { join, resolve } from 'node:path'
import { NodeMediaWin } from './NodeMediaWin';
import { KeyWin } from './KeyWin';
import { Tools } from '../utils';
import { Listeners } from '../listeners';
import log  from 'electron-log';
import { fork } from 'child_process';
export class MainWin {
  private win: BrowserWindow | null = null;
  public constructor() {
    const preload = join(__dirname, '../preload/index.js')
    const url = process.env.VITE_DEV_SERVER_URL
    const indexHtml = join(process.env.DIST, 'index.html')
    this.win = new BrowserWindow({
      title: 'Main window',
      icon: join(process.env.PUBLIC, 'favicon.ico'),
      webPreferences: {
        preload,
        // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
        // Consider using contextBridge.exposeInMainWorld
        // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
        nodeIntegration: true,
        contextIsolation: false,
        nodeIntegrationInWorker: true
      },
    });
  
    this.win.on("closed", () => {
      app.emit("window-all-closed");
    });
    const _that = this;
    const template = Menu.buildFromTemplate([
      {
        label: '设置', submenu: [
          {
            label: '弹幕令牌', click: function () {
              new KeyWin(_that.win);
            }
          },
          {
            label: 'NodeMediaServer', click: function () {
              new NodeMediaWin();
            }
          },
        ]
      }
    ]);
    Menu.setApplicationMenu(template);
  
    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
      this.win.loadURL(url)
      // Open devTool if the app is not packaged
      this.win.webContents.openDevTools()
    } else {
      this.win.loadFile(indexHtml)
    }
  
    this.testPorts();
    //测试
    new Listeners(this.win);
    this.runMediaServer();
    this.runDanmuServer();
    // Test actively push message to the Electron-Renderer
    this.win.webContents.on('did-finish-load', () => {
      this.win?.webContents.send('main-process-message', new Date().toLocaleString())
    })
  
    // Make all links open with the browser, not with the application
    this.win.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:')) shell.openExternal(url)
      return { action: 'deny' }
    })
  }
  public getWin () {
    return this.win;
  }
  async testPorts() {
    try {
      const info:any = await Tools.findPort('8936');
      await Tools.killPort(info.pId);
    } catch (e) { }
    try {
      const info:any = await Tools.findPort('8935');
      await Tools.killPort(info.pId);
    } catch (e) { }
    try {
      const info:any = await Tools.findPort('8173');
      await Tools.killPort(info.pId);
    } catch (e) { }
  }

  forkChild(tsFile) {
    const child = fork(tsFile, {
      silent: true
    });
    child.stdout.on('data', (result) => {
      log.info(Buffer.from(result).toString());
    });
    child.stderr.on('data', (result) => {
      log.error(Buffer.from(result).toString());
    });
    child.on('exit', () => {
      setTimeout(() => {
        this.forkChild(tsFile);
      }, 1000);
    });
  }

  runMediaServer() {
    const mediaServerFile = resolve(join(__dirname, 'worker',`MediaServer.js`)).replace(/\\/g, '/');
    this.forkChild(mediaServerFile);
  }

  runDanmuServer() {
    const danmuServerFile = resolve(join(__dirname, 'worker', `DanmuServer.js`)).replace(/\\/g, '/');;
    this.forkChild(danmuServerFile);
  }
}