import { ipcMain, BrowserWindow } from 'electron'
import { Pocket } from './pocket/pocket';
import { VideoWin } from './win/video';
import log  from 'electron-log';

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
      const video = new VideoWin(win, args[0]);
      // TODO: 待优化
      setTimeout(() => {
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
            item.videoWin.close();
            this.videoWinList.splice(index, 1);
          }
        })
      } catch (e) {
        log.error(`close the liveId ${ args[0] } is error: ${ e }` );
      }
    });
  }
}