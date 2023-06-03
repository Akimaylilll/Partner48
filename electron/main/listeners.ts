import { ipcMain, BrowserWindow } from 'electron'
import { Pocket } from './pocket/pocket';
import { VideoWin } from './win/VideoWin';
import log  from 'electron-log';
import Store from 'electron-store';

export class Listeners {
  private videoWinList: Array<VideoWin> = [];
  // private win: BrowserWindow | null = null
  constructor(win: BrowserWindow) {
    // ipcMain.on('lives-list', (event, ...args) => {
    //   const pocket: Pocket = new Pocket();
    //   pocket.getLiveList().then(value => {
    //     console.log(value);
    //   });
    // });

    ipcMain.on('lives-list-query', (event, ...args) => {
      const pocket: Pocket = new Pocket();
      pocket.getLiveList(args[0], args[1]).then(value => {
        event.reply('lives-list-reply', value);
      });
    });

    ipcMain.on('open-live-query', (event, ...args) => {
      const video = new VideoWin(args[0]);
      // TODO: 待优化
      setTimeout(() => {
        if(!video.videoWin || video.videoWin.isDestroyed()){
          return;
        }
        if(video.videoWin.isVisible()) {
          this.videoWinList.push(video);
        } else {
          video.videoWin.close();
        }
      }, 5000);
      event.reply('open-live-reply', video.source);
    });
    ipcMain.on('close-live-win', (event, ...args) => {
      try{
        this.videoWinList.map((item, index) => {
          if(item.liveId == args[0]) {
            log.info("close the liveId:" + args[0]);
            if(!item.videoWin?.isDestroyed()){
              item.videoWin.close();
            }
            this.videoWinList.splice(index, 1);
          }
        })
      } catch (e) {
        log.error(`close the liveId ${ args[0] } is error: ${ e }` );
      }
    });

    ipcMain.on('im-key-query', (event, ...args) => {
      const store = new Store();
      const imKey = store.get('netease-im-key');
      event.reply('im-key-reply', imKey);
    });

    ipcMain.on('set-im-key', (event, ...args) => {
      const store = new Store();
      store.set('netease-im-key', args[0]);
    });

    ipcMain.on('close-im-key-win', (event, ...args) => {
      const childWin = win.getChildWindows();
      childWin.map(item => {
        if(item.title === "弹幕令牌设置") {
          item.close();
        }
      })
    });
    ipcMain.on('get-port-query', (event, ...args) => {
      const store = new Store();
      const live_port = store.get("LIVE_PORT");
      const danmu_port = store.get("DANMAKU_PORT");
      event.reply('get-port-reply', {danmu_port, live_port});
    });
  }
}