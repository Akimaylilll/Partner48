import { app, BrowserWindow, ipcMain } from 'electron';
import { Pocket } from '../pocket/pocket';
import { join, basename, dirname, resolve } from 'node:path';
import { readFileSync, rmSync, existsSync } from 'fs';
import download from "download";
import { fork } from 'child_process';
import treeKill from 'tree-kill';

import log  from 'electron-log';
import { Tools } from '../utils';
import Store from 'electron-store';
import { reject } from 'lodash';
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
  private timer = null;
  private isClosed = false;
  private pids: Array<number> = [];

  public constructor(liveId: string, liveUser: string) {
    this.liveId = liveId;
    this.liveUser = liveUser;
    this.open();
  }

  public open() {
    this.videoWin = new BrowserWindow({
      useContentSize: true,
      height: this.height,
      width: this.width,
      resizable: true,
      show: true,
      title: this.liveUser,
      webPreferences: {
        nodeIntegration: true,
        // 官网似乎说是默认false，但是这里必须设置contextIsolation
        contextIsolation: false
      }
    });
    this.videoWin.menuBarVisible = false;

    this.videoWin.on('close', (event) => {
      // this.ffmpegServer && this.ffmpegServer.kill();
      // this.ffmpegServer = null;
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
    ipcMain.on('video-restart', async (event, liveId)=>{
      if(this.liveId === liveId) {
        await this.restartFfmpegServer();
      }
    });
    // 通知模态框渲染完成
    ipcMain.once('modal-accomplish',(event,msg)=>{
      // 发送给渲染进程
      if(this.videoWin.isDestroyed()) {
        return;
      }
      this.videoWin.webContents.send('video-id', this.liveId);
      const pocket: Pocket = new Pocket();
      pocket.getOneLiveById(this.liveId).then(async (content) => {
        if(!content || !content.user) {
          ipcMain.emit("main-message-alert", true, "该直播已关闭或不存在");
          !this.videoWin.isDestroyed() && this.videoWin.close();
          return;
        }
        this.source = content.playStreamPath;
        this.liveUser = this.liveUser;
        this.liveType = content.liveType;
        if(this.source.indexOf('.m3u8') === -1){
          this.roomId = content.roomId;
          try{
            this.runFfmpegServer();
          }
          catch(e){
            log.error(e);
          }
        } else {
          const store = new Store();
          const live_port = store.get("LIVE_PORT");
          const danmu_port = store.get("DANMAKU_PORT");
          this.danmuData = await this.getDanmuData(content.msgFilePath);
          this.videoWin.webContents.send('open-video-id', this.liveId,
          this.liveUser, this.source, this.liveType,
          this.danmuData, this.roomId, danmu_port, live_port);
        }
      });
    })
  }

  public closeFfmpegServer() {
    this.isClosed = true;
    // setTimeout(() => {
      this.timer && clearInterval(this.timer);
      this.timer = null;
      ipcMain.emit("main-delete-childProcess", true, this.ffmpegServer);
      this.killAllPids().then(() => {
        log.log("kill all pids");
      })
    // }, 5000);
  }

  public killAllPids(isRestart: boolean = false) {
    return Promise.all(this.pids.map((pid) => {
      return new Promise((resolve, reject) => {
        this.isClosed = true;
        treeKill(pid, 'SIGKILL', (err) => {
          if(err) {
            log.error(err);
            reject;
          } else {
            this.pids.splice(this.pids.indexOf(pid), 1);
            console.log("kill", pid);
            this.ffmpegServer = null;
            isRestart && (this.isClosed = false);
            isRestart && this.runFfmpegServer();
            resolve;
          }
        });
      });
    }));
  }

  public async restartFfmpegServer() {
    // setTimeout(() => {
      this.timer && clearInterval(this.timer);
      this.timer = null;
      ipcMain.emit("main-delete-childProcess", true, this.ffmpegServer);
      // await Tools.killProcess(this.ffmpegServer?.pid);
      await this.killAllPids(true);
      
    // }, 5000);
  }

  public runFfmpegServer() {
    const source = this.source;
    const liveId = this.liveId.toString();
    const host = "localhost";
    const port = (new Store()).get("MEDIA_SERVER_RTMP_PORT") as string || "8935"
    const ffmpegServerFile = resolve(join(__dirname, 'worker', `FfmpegServer.js`)).replace(/\\/g, '/');
    this.ffmpegServer = fork(ffmpegServerFile,
      [source, liveId, host, port], {
      silent: true
    });
    this.pids.push(this.ffmpegServer?.pid);
    console.log("first",this.ffmpegServer?.pid)
    let repeat = 3;
    const timerFunction = () => {
      this.timer && clearInterval(this.timer);
      this.timer = null;
      this.timer = setInterval(() => {
        if(this.isClosed) {
          // !this.videoWin?.isDestroyed() && this.videoWin.close();
          this.timer && clearInterval(this.timer);
          this.timer = null;
          return;
        }
        if(repeat < 0) {
          !this.videoWin.isDestroyed() && this.videoWin.close();
          this.timer && clearInterval(this.timer);
          this.timer = null;
          ipcMain.emit("main-message-alert", true, "直播已关闭");
          return;
        }
        repeat --;
        this.ffmpegServer = null;
        this.ffmpegServer = fork(ffmpegServerFile,
          [source, liveId, host, port], {
          silent: true
        });
        this.pids.push(this.ffmpegServer?.pid);
        console.log("for",this.ffmpegServer?.pid)
        this.ffmpegServer.stdout.on('data', (result) => {
          const res = Buffer.from(result).toString();
          // log.info(res);
          if(res.indexOf("Vedio is Pushing") > -1) {
            repeat = 3;
            // timerFunction();
          }
        });
        this.ffmpegServer.stderr.on('data', (result) => {
          log.error(Buffer.from(result).toString());
        });
        this.ffmpegServer.liveId = liveId;
        this.ffmpegServer.videoWin = this.videoWin;
        !this.videoWin?.isDestroyed() && this.videoWin?.webContents.send('open-video-id', this.liveId,
        this.liveUser, this.source, this.liveType,
        this.danmuData, this.roomId, danmu_port, live_port);
        ipcMain.emit("main-add-childProcess", true, this.ffmpegServer);
      }, 2000);
    }
    this.ffmpegServer.stdout.on('data', (result) => {
      const res = Buffer.from(result).toString();
      // log.info(res);
      if(res.indexOf("Vedio is Pushing") > -1) {
        timerFunction();
      }
    });
    this.ffmpegServer.stderr.on('data', (result) => {
      log.error(Buffer.from(result).toString());
    });
    const store = new Store();
    const live_port = store.get("LIVE_PORT");
    const danmu_port = store.get("DANMAKU_PORT");
    this.videoWin?.webContents.send('open-video-id', this.liveId,
      this.liveUser, this.source, this.liveType,
      this.danmuData, this.roomId, danmu_port, live_port);
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