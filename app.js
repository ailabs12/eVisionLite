var express = require('express'),
  http = require('http');

var cookieParser = require('cookie-parser')
var cookieSession = require('cookie-session');

var app = express();
var pm2 = require('pm2');

// HTTP server
var server = http.createServer(app);

// WebSocket server
var WebSocket = require('ws');
var wss = new WebSocket.Server({
  server: server
});

app.use(cookieParser());
app.use(cookieSession({
    secret: '00b2a1e6-eb0e-11e7-80c1-9a214cf093a3',
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

require('./detector/lib/routes/authMain')(app);
require('./detector/lib/routes/sysStats')(app);

app.use(express.static('portal'));

app.set('port', process.env.WEB_PORT || 3000);

server.listen(app.get('port'), function() {
  console.log('HTTP server listening on port ' + app.get('port'));
});

wss.on('connection', function(ws) {

  ws.send(JSON.stringify({
    state: conf
  }));
  ws.on('message', function(data) {
    try {
      var res = JSON.parse(data);
      //console.log(res);
      if (res.action == 'startNextNode') startNextNode(res.device);
      if (res.action == 'stopNode') stopNode(res.node);
      if (res.action == 'settingsChange') settingsChange(res.settings);
    } catch (e) {}
  })
});

wss.broadcast = function(data) {
  wss.clients.forEach(function(client) {
    if (client.readyState == 1) {
      client.send(data);
    }
  })
};

const getPort = require('get-port');
const spawn = require('child_process').spawn;
const fs = require('fs');

var processes = {};
var maxNodes = 12;

var conf = {},
  confFile = "./app.json";
  setFile = "./settings.json";

process.env['AUTH_SETTINGS'] = process.cwd() + "/settings.json";

function getConf(confFile, cb) {
  fs.readFile(confFile, function(err, data) {
    try {
      cb(JSON.parse(data))
    } catch (e) {
      cb({})
    }
  });
};

function saveConf(file, data) {
  fs.writeFile(file, JSON.stringify(data), function() {});
};

function stopNodeProcesses(id, cb) {
  pm2.connect(function(err) {
    pm2.stop('video' + id, function() {});
    if (processes[id] && processes[id].detector) pm2.stop('detector' + id, function() {
      delete processes[id];
      if (cb) cb();
    });
  })
}

function deleteNodeProcesses(id, cb) {
  pm2.connect(function(err) {
    pm2.delete('video' + id, function() {});
    if (processes[id] && processes[id].detector) pm2.delete('detector' + id, function() {
      delete processes[id];
      if (cb) cb();
    });
  })
}

function stopNode(id) {
  deleteNodeProcesses(id);
  conf[id] = 0;
  saveConf(confFile, conf);
};

function startNextNode(device) {
  var id = 0;
  var nodeIndx;

  while (!nodeIndx && id++ < maxNodes) {
    if (!processes[id]) nodeIndx = id;
  };
  if (!nodeIndx) return wss.broadcast(JSON.stringify({
    message: 'Превышено максимально допустимое количество камер!'
  }))
  startNode(nodeIndx, device);
};

function startNode(id, device, cb) {
  if (typeof device === 'function') {
    cb = device;
    device = void 0;
  }

  processes[id] = processes[id] || {};

  getPort().then(function(detector_port) {        
    pm2.start({
      cwd: "./detector",
      env: {
          PATH: process.env.PATH + ':' + process.cwd() + ':' + process.cwd() +'/detector',
        WEB_PORT: detector_port,
        node_path: '../data/node' + id,
        device: device
      },
      script: 'server.js',
      name: 'detector' + id
    }, function(err, apps) {

      pm2.launchBus((err, bus) => {
        bus.on('log:out', data => {

          //console.log(data.process.name, data.data.toString());
          if (data.process.name != 'detector' + id || !/HTTP server listening on port/.test(data.data.toString())) return;

          processes[id].detector = true;

          wss.broadcast(JSON.stringify({
            node: id,
            port: detector_port,
            status: 'started'
          }))

          conf[id] = detector_port;
          saveConf(confFile, conf);

          //pm2.disconnect(); // Disconnects from PM2
          if (cb) cb(id, detector_port);
          //console.log(processes)
        });
      });
    });

  })
}

process.on('SIGINT', exitHandler);
process.on('exit', exitHandler);

function exitHandler() {
  try {
    function toDo() {
      var ids = Object.keys(processes);
      //console.log(ids);
      if (ids.length)
        stopNodeProcesses(ids[0], toDo);
      else
        process.exit(0)
    }
    toDo();
    //this.close(true);
  } catch (e) {
    console.log(e)
  }
};

function settingsChange(settings) {
  getConf(setFile, function(data) {
    if (data.password == settings.passwordOld) {
      if (settings.login != '') data.login = settings.login;
      if (settings.passwordNew != '') data.password = settings.passwordNew;
      saveConf(setFile, data);
    }
  });
};


getConf(confFile, function(data) {
  conf = data || {};
  var ids = [];
  for (var indx in conf) {
    if (conf[indx] && indx <= maxNodes)
      ids.push(indx);
  }
  function toDo() {
    if (ids.length)
      startNode(ids.shift(), toDo);
  }
  pm2.connect(toDo);
});
