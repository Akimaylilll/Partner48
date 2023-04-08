
import NodeMediaServer from 'node-media-server'

const config = {
  rtmp: {
      port: 8935,
      chunk_size: 0,
      gop_cache: false,
      ping: 60,
      ping_timeout: 30
  },
  http: {
      port: 8936,
      allow_origin: '*',
  }
};
var nms = new NodeMediaServer(config)
nms.run();