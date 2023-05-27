
import NodeMediaServer from 'node-media-server';

const numCPUs = require('os').cpus().length;

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
  },
  cluster: {
    num: (numCPUs / 2) || 1
  }
};
var nms = new NodeMediaServer(config);
nms.run();