import { app, BrowserWindow, ipcMain } from 'electron';
import { Pocket } from '../pocket/pocket';
import { join, basename, dirname, resolve } from 'node:path';
import { readFileSync, rmSync, existsSync } from 'fs';
import download from "download";
import { fork } from 'child_process';

import log  from 'electron-log';
import { Tools } from '../utils';
import Store from 'electron-store';
export class VideoWin {
  public source: string = null;
  public liveId: string = null;
  private liveType: number = 1;
  private liveUser: string = null;
  private height: number = 620;
  private width: number = 320;
  public videoWin: BrowserWindow = null;
  private danmuData: Array<any> = [];
  private roomId: string = "";
  private ffmpegServer: any = null;

  public constructor(liveId: string) {
    this.liveId = liveId;
    const pocket: Pocket = new Pocket();
    pocket.getOneLiveById(liveId).then(async (content) => {
      if(!content || !content.user) {
        ipcMain.emit("main-message-alert", true, "该直播已关闭或不存在");
        return;
      }
      this.source = content.playStreamPath;
      this.liveUser = content.user.userName;
      this.liveType = content.liveType;
      this.open();
      if(this.source.indexOf('.m3u8') === -1){
        this.roomId = content.roomId;
        try{
          setTimeout(() => {
            this.runFfmpegServer();
          }, 1000);
        }
        catch(e){
          log.error(e);
        }
      } else {
        const store = new Store();
        const live_port = store.get("LIVE_PORT");
        const danmu_port = store.get("DANMAKU_PORT");
        this.danmuData = await this.getDanmuData(content.msgFilePath);
        setTimeout(() => {
          this.videoWin.webContents.send('open-video-id', this.liveId,
            this.liveUser, this.source, this.liveType,
            this.danmuData, this.roomId, danmu_port, live_port);
        }, 500);
        this.videoWin.show();
      }
    });
  }

  public open() {
    this.videoWin = new BrowserWindow({
      useContentSize: true,
      height: this.height,
      width: this.width,
      resizable: true,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        // 官网似乎说是默认false，但是这里必须设置contextIsolation
        contextIsolation: false
      }
    });
    this.videoWin.menuBarVisible = false;

    this.videoWin.on('close', (event) => {
      this.ffmpegServer && this.ffmpegServer.kill();
      this.ffmpegServer = null;
      ipcMain.emit('close-live-win', null, this.liveId);
    });

    const url = process.env.VITE_DEV_SERVER_URL;
    if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
      this.videoWin.loadURL(url + '#/live');
      // Open devTool if the app is not packaged
      this.videoWin.webContents.openDevTools();
    } else {
      this.videoWin.loadFile(join(process.env.DIST, 'index.html'), {
        hash: 'live'
      });
    }
  }

  public closeFfmpegServer() {
    this.ffmpegServer && this.ffmpegServer.kill();
    this.ffmpegServer = null;
    ipcMain.emit("main-delete-childProcess", true, this.ffmpegServer);
  }

  public runFfmpegServer(isSendEvent = true) {
    const source = this.source;
    const liveId = this.liveId.toString();
    const host = "localhost";
    const port = (new Store()).get("MEDIA_SERVER_RTMP_PORT") as string || "8935"
    const ffmpegServerFile = resolve(join(__dirname, 'worker', `FfmpegServer.js`)).replace(/\\/g, '/');;
    this.ffmpegServer = fork(ffmpegServerFile,
      [source, liveId, host, port], {
      silent: true
    });
    this.ffmpegServer.stdout.on('data', (result) => {
      const res = Buffer.from(result).toString();
      log.info(res);
      if(res.indexOf("event: ffmpeg server start") > -1 && isSendEvent) {
        const store = new Store();
        const live_port = store.get("LIVE_PORT");
        const danmu_port = store.get("DANMAKU_PORT");
        this.videoWin.webContents.send('open-video-id', this.liveId,
          this.liveUser, this.source, this.liveType,
          this.danmuData, this.roomId, danmu_port, live_port);
        this.videoWin.show();
      }
      if(res.indexOf("event: ffmpeg server error") > -1 || 
        res.indexOf("event: ffmpeg server end") > -1 ) {
          this.videoWin.webContents.send('ffmpeg-server-close');
      }
    });
    this.ffmpegServer.stderr.on('data', (result) => {
      log.error(Buffer.from(result).toString());
    });
    this.ffmpegServer.liveId = liveId;
    this.ffmpegServer.videoWin = this.videoWin;
    ipcMain.emit("main-add-childProcess", true, this.ffmpegServer);
  }

  async getDanmuData(filepath: string) : Promise<Array<any>> {
    const downloadPath = dirname(app.getAppPath());
    await download(filepath, join(downloadPath, '/download'));
    const lrcFilePath: string = join(downloadPath, '/download', basename(filepath));
    const lrcFileData: string = readFileSync(lrcFilePath, 'utf-8');
    const danmuData :any[] = [];
    lrcFileData.split(/\r?\n/).forEach(raw => {
      const dtime: number | undefined = Tools.toSec(raw.match(/\[(.*?)\]/)?.[1]);
      const dauthor: string = raw.match(/\](.*?)\t/)?.[1] || "";
      const dmessage: string = raw.substring(raw.indexOf('\t') + 1, raw.length);
      if(dtime && dmessage) {
        danmuData.push([dtime, 0, 16777215, dauthor, dmessage]);
      }
    });
    if(existsSync(lrcFilePath)) {
      rmSync(lrcFilePath);
    }
    return danmuData;
  }
}