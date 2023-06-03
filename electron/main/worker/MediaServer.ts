
import NodeMediaServer from 'node-media-server';

const numCPUs = require('os').cpus().length;

const rtmp_port = process.argv[2] || 8935;
const http_port = process.argv[3] || 8936;

const config = {
  rtmp: {
      port: rtmp_port,
      chunk_size: 0,
      gop_cache: false,
      ping: 60,
      ping_timeout: 30
  },
  http: {
      port: http_port,
      allow_origin: '*',
  },
  cluster: {
    num: (numCPUs / 2) || 1
  }
};
var nms = new NodeMediaServer(config);
nms.run();