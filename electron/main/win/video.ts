import { BrowserWindow, UtilityProcess } from 'electron';
import { Pocket } from '../pocket/pocket';
import { join, basename } from 'node:path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import { readFileSync } from 'fs';
import download from "download";

import log  from 'electron-log';
import { Tools } from '../utils';
export class VideoWin {
  public source: string = null;
  public liveId: string = null;
  private liveType: number = 1;
  private liveUser: string = null;
  private parentWin: BrowserWindow = null;
  private height: number = 620;
  private width: number = 320;
  private worker: UtilityProcess  = null;
  public videoWin: BrowserWindow = null;
  private danmuData: Array<any> = [];
  private roomId: string = "";

  public constructor(parentWin: BrowserWindow, liveId: string) {
    this.liveId = liveId;
    this.parentWin = parentWin;
    const pocket: Pocket = new Pocket();
    pocket.getOneLiveById(liveId).then(async (content) => {
      this.source = content.playStreamPath;
      this.liveUser = content.user.userName;
      this.liveType = content.liveType;
      if(this.source.indexOf('.m3u8') === -1){
        this.roomId = content.roomId;
        try{
          this.ffmpegServer(this.source, this.liveId.toString(), "localhost", "8935");
        }
        catch(e){
          log.error(e);
        }
      } else {
        this.danmuData = await this.getDanmuData(content.msgFilePath);
      }
      this.open();
    });
  }

  public open() {
    this.videoWin = new BrowserWindow({
      useContentSize: true,
      height: this.height,
      width: this.width,
      resizable: true,
      show: false,
      parent: this.parentWin,
      webPreferences: {
        nodeIntegration: true,
        // 官网似乎说是默认false，但是这里必须设置contextIsolation
        contextIsolation: false
      }
    });

    this.videoWin.on('close', (event) => {
      this.worker && this.worker.kill()
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
      // videoWin.webContents.openDevTools()
    }
    setTimeout(() => {
      this.videoWin.webContents.send('open-video-id', this.liveId, this.liveUser, this.source, this.liveType, this.danmuData, this.roomId);
      this.videoWin.show();
    }, 1000);
  }

  ffmpegServer(source, liveId, host, port) {
    ffmpeg.setFfmpegPath(ffmpegPath.replace(
      'app.asar',
      'app.asar.unpacked'
    ));
    ffmpeg.setFfprobePath(ffprobePath.path.replace(
      'app.asar',
      'app.asar.unpacked'
    ));
    const command = ffmpeg(source)
      .inputOptions('-re')
      .on('start', function (commandLine) {
        log.info('[' + new Date() + '] Vedio is Pushing !');
        log.info('commandLine: ' + commandLine);
      })
      .on('error', function (err, stdout, stderr) {
        log.error('error: ' + err.message);
        log.error('stdout: ' + stdout);
        log.error('stderr: ' + stderr);
      })
      .on('end', function () {
        log.info('[' + new Date() + '] Vedio Pushing is Finished !');
      })
      .addOptions([
        '-c:v libx264',
        '-preset superfast',
        '-tune zerolatency',
        '-c:a aac',
        '-ar 44100'
      ])
      .format('flv');

    command.output(`rtmp://${host}:${port}/live/${liveId}`, {
      end: true
    }).run();
  }

  async getDanmuData(filepath: string) : Promise<Array<any>> {
    await download(filepath, join(__dirname, '/download'));
    const lrcFilePath: string = join(__dirname, '/download', basename(filepath));
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
    return danmuData;
  }
}