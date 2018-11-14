const net = require('net');
const url = require('url');

var client;

module.exports = {
  init: function(params) {
    return new Promise(function(resolve, reject) {
      client = new net.Socket();

      const connect = (url, params) => {
        client.connect(url.port, url.hostname, () => {
          console.log('SIGUR connected: ' + url.href);
          let cmd = ['LOGIN 1.8', params.onvifUser, params.onvifPass];
          client.write(cmd.join(' ') + '\n');
        });
      }

      const prepareUrl = (srcUrl) => {
        let prefixs = ['http://', 'ftp://', 'rtsp://', 'tcp://'];
        if (!prefixs.some(element => srcUrl.includes(element))) srcUrl = prefixs[0] + srcUrl;
        return url.parse(srcUrl);
      }

      let urlP = prepareUrl(params.onvifUrl);

      if (urlP.port && urlP.hostname) {
        connect(urlP, params);
      } else {
        return reject("SIGUR url doesn't have hostname or port");
      }

      client.on('data', (data) => {
        let dataArr = data.toString().split(' ');
        if (dataArr[4] == params.acsDeviceID && dataArr[6] == params.acsDirection)
          console.log(dataArr);
        resolve(data);
      });

      client.on('error', (err) => {
        if (err.code == 'ECONNREFUSED') {
          console.log('Timeout for 5 seconds before trying:' + urlP.href + ' again');
          client.setTimeout(5000, connect(urlP, params));
        } else {
          console.error('[init error]: ' + err);
          return reject(err);
        };
      });
    });
  },
  open: function(params) {
    let cmd = ['ALLOWPASS', params.acsDeviceID, 'ANONYMOUS', params.acsDirection];
    client.write(cmd.join(' ') + '\n');

    client.on('error', (err) => {
      console.error('[open error]: ' + err);
    });
  },
  subscribe: function(params) {
    client.write('SUBSCRIBE' + '\n');

    client.on('error', (err) => {
      console.error('[subscribe error]: ' + err);
    });
  }
}
