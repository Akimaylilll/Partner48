
const NodeMediaServer = require('node-media-server')

const config = {
  rtmp: {
      port: 1935,
      chunk_size: 0,
      gop_cache: false,
      ping: 60,
      ping_timeout: 30
  },
  http: {
      port: 8088,
      allow_origin: '*',
  }
};
var nms = new NodeMediaServer(config)
nms.run();