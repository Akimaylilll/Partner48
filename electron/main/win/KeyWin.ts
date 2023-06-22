import { BrowserWindow, globalShortcut } from 'electron';
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


    KeyWin.on('focus', () => {
      // mac下快捷键失效的问题
      if (process.platform === 'darwin') {
        let contents = KeyWin.webContents
        globalShortcut.register('CommandOrControl+C', () => {
          console.log('注册复制快捷键成功')
          contents.copy()
        })
        globalShortcut.register('CommandOrControl+V', () => {
          console.log('注册粘贴快捷键成功')
          contents.paste()
        })
        globalShortcut.register('CommandOrControl+X', () => {
          console.log('注册剪切快捷键成功')
          contents.cut()
        })
        globalShortcut.register('CommandOrControl+A', () => {
          console.log('注册全选快捷键成功')
          contents.selectAll()
        })
      }
    })
    KeyWin.on('blur', () => {
      globalShortcut.unregisterAll() // 注销键盘事件
    })
    KeyWin.on('close', () => {
      globalShortcut.unregisterAll() // 注销键盘事件
    })

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