import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

const source = process.argv[2];
const liveId = process.argv[3];
const host = process.argv[4];
const port = process.argv[5];

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
  console.log('commandLine: ' + commandLine);
  console.log("event: ffmpeg server start");
})
.on('error', function (err, stdout, stderr) {
  console.log('error: ' + err.message);
  console.log('stdout: ' + stdout);
  console.log('stderr: ' + stderr);
  console.log("event: ffmpeg server error");
})
.on('progress', function (progress) {
  console.log('[' + new Date() + '] Vedio is Pushing !');
})
.on('end', function () {
  console.log('[' + new Date() + '] Vedio Pushing is Finished !');
  console.log("event: ffmpeg server end");
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
end: false, autoClose: false
}).run();