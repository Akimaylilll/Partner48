import { ipcMain, BrowserWindow } from 'electron'
import { Pocket } from './pocket/pocket';
import { VideoWin } from './win/video';

export class Listeners {
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
      // const win = VideoWin(args.parentId, args.source, args.liveId)
      const video = new VideoWin(win, args[0]);
      event.reply('open-live-reply', video.source);
    });
  }
}