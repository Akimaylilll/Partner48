import { BrowserWindow, Menu, UtilityProcess } from 'electron';
import { Pocket } from '../pocket/pocket';
import { join } from 'node:path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static'

import log  from 'electron-log';
export class VideoWin {
  public source: string = null;
  private liveId: string = null;
  private liveUser: string = null;
  private parentWin: BrowserWindow = null;
  private height: number = 620;
  private width: number = 320;
  private worker: UtilityProcess  = null;
  public videoWin: BrowserWindow = null;

  public constructor(parentWin: BrowserWindow, liveId: string) {
    this.liveId = liveId;
    this.parentWin = parentWin;
    const pocket: Pocket = new Pocket();
    pocket.getOneLiveById(liveId).then((content) => {
      this.source = content.playStreamPath;
      this.liveUser = content.user.userName;
      if(this.source.indexOf('.m3u8') === -1){
        try{
          this.ffmpegServer(this.source, this.liveId.toString(), "localhost", "1935");
        }
        catch(e){
          log.error(e);
        }
      }
      this.open();
    });
  }

  public open() {
    Menu.setApplicationMenu(null);
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
      this.videoWin.webContents.send('open-video-id', this.liveId, this.liveUser, this.source);
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
}