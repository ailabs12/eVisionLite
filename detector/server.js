process.env.TZ = "Europe/Moscow"

require('log-timestamp');

process.on('uncaughtException', function(e) {
    console.log('uncaughtException', e);
});

// modules
var express = require('express'),
    http = require('http');

var cookieParser = require('cookie-parser')
var session = require('express-session');

var request = require('request');

var pm2 = require('pm2');

var url = require('url');

// configuration
var params = {};
var jsonfile = require('jsonfile')
var node_path = process.env.node_path || '.';
var defSettingsFile = 'settings.json';
var settingsFile = node_path + '/' + defSettingsFile;
var id = node_path.slice(-1);
var eventTimeout = false;

function loadSettings(file, cb) {
    fs.exists(file, function(exists) {
        if (exists)
            toDo()
        else
            enfsensure.ensureFile(file, {
                stream: true,
                streamOptions: {
                    autoClose: true
                }
            }, function(err, stream) {
                stream.on('finish', toDo);
                fs.createReadStream(defSettingsFile).pipe(stream);
            })
    })

    function toDo() {
        jsonfile.readFile(file, function(err, obj) {
            cb(obj);
        })
    }

}

function saveSettings(file, params) {
    jsonfile.writeFile(file, params, function(err) {
        if (err) console.log(err)
    })
}

var _lic;
// app parameters
var app = express();

app.use(cookieParser())
app.use(session({
    secret: '00b2a1e6-eb0e-11e7-80c1-9a214cf093ae',
    resave: true,
    saveUninitialized: true
}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// HTTP server
var server = http.createServer(app);

// WebSocket server
var WebSocket = require('ws');
var wss = new WebSocket.Server({
    server: server
});

wss.saveSettings = function(data) {
    saveSettings(settingsFile, data);
    var lastLic = params.lic;
    var lastEnableObjectDetect = params.enableObjectDetect;
    for (var k in data)
        params[k] = data[k];
    if ((params.lic && params.enableObjectDetect && lastLic != params.lic) ||
	(params.enableObjectDetect && !lastEnableObjectDetect))
        checkLic()
};

wss.on('connection', checkLic);

wss.broadcast = function(data, opts) {
    wss.clients.forEach(function(client) {
        if (client.readyState == 1) {
            client.send(data, opts);
        }
    })
};


const Rtsp2 = require('./lib/rtsp2');
//var Rtsp = require('./lib/rtsp');
var rtsp;
var event = require('./lib/event');
var imageProcess = require('./lib/imageProcess');
var motionDetection = require('./lib/motionDetection');
var cropImage = require('./lib/cropImage');
var Faces = require('./lib/face');
var onvifRelay = require('./lib/onvifRelay');
var TrustedID = require('./lib/trustedID');
var request = require('request');


process.on('exit', function() {
    if (rtsp)
        rtsp.stop();
    console.log('Goodbye!');
});


const path = require("path");
const fs = require('fs');
const enfsensure = require("enfsensure");

var rootPath = '..';
var _selfNode = path.resolve(node_path).split('/').pop();
//var _selfNode = path.resolve(node_path).split('\\').pop();// win

function checkLic() {
    if (!params.enableObjectDetect) return;
    if (!params.lic) {
        _lic = false;
        return wss.broadcast('msgLicNotDetected', {
            binary: false
        });
    };
    _lic = true;
}

function start(obj) {
    params = obj;

    //Matrix II Wi-Fi Controller Hack
    /*
    app.post('/', (req, res, next) => {
     req.query.password = params.password;
     req.url = '/api/scud/event';
     next();
    })
    */
    ///dev/video1
    if (process.env.device && !params.camUrl) {
        const prepareUrl = (srcUrl) => {
            let prefixs = ['http://', 'ftp://', 'rtsp://', 'tcp://'];
            if (!prefixs.some(element => srcUrl.includes(element))) srcUrl = prefixs[0] + srcUrl;
            return url.parse(srcUrl);
        }

        let device = JSON.parse(process.env.device);

        var urlObj = prepareUrl(device.url);

        let hostnamewp;
        if (device.url != '') hostnamewp = urlObj.hostname + (urlObj.port ? ':' + urlObj.port : '');
        else hostnamewp = '';

        params.camName = device.name;
        params.device = device.device;

        if (device.objectType == null) device.objectType = 0;
        params.objectType = device.objectType;

        if (params.device == 'Beward') {
            params.camUrl = 'http://' + hostnamewp + '/cgi-bin/images_cgi?channel=0&user=' + device.login + '&pwd=' + device.password;
            params.onvifUrl = 'http://' + urlObj.hostname + ':2000/onvif/device_service';
            params.sipUri = 'sip:1@' + hostnamewp ;
            params.onvifUser = device.login;
            params.onvifPass = device.password;
        } else if (params.device == 'Dahua') {
            params.camUrl = 'rtsp://' + device.login + ':' + device.password + '@' + hostnamewp;
            params.onvifUrl = urlObj.protocol + '//' + hostnamewp;
            params.sipUri = 'sip:1@' + hostnamewp ;
            params.onvifUser = device.login;
            params.onvifPass = device.password;
        } else if (params.device == 'ТЕТА') {
            params.camUrl = 'rtsp://' + device.login + ':' + device.password + '@' + hostnamewp + '/cam/realmonitor?channel=1&subtype=1';
            params.onvifUrl = 'http://' + hostnamewp + '/onvif/device_service';
            params.onvifUser = device.login;
            params.onvifPass = device.password;
            params.onvifRelayOutputToken = '000';
        } else params.camUrl = 'rtsp://' + device.login + ':' + device.password + '@' + hostnamewp ;

        process.env.device = null;
    }

    require('./lib/voice')(params, {}, wss);
    require('./lib/routes/auth')(app, params);
    require('./lib/routes/faceStore')(app, params);

    if (params.device == 'SIGUR') {
        var tcpClient = require('./lib/tcpClient');
        tcpClient.init(params)
          .then((response) => {
            tcpClient.subscribe(params);
          }).catch((err) => {
            console.log('[error]:', err);
          });

    }
    require('./lib/routes/relay')(app, params);
    require('./lib/routes/scud')(app, params);
    require('./lib/routes/videoStore')(app, params);
    wss.on('connection', function(ws, req) {
        require('./lib/routes/socket').bind(wss)(ws, req, onFrameData, params)
    });

    app.set('port', process.env.WEB_PORT || params['web.port'] || 3000);

    server.listen(app.get('port'), function() {
        console.log('HTTP server listening on port ' + app.get('port'));
    });

    if (!params.camUrl)
        return console.log('Param "camUrl" not found');

    var onStreamData = require('./lib/stream')(params, wss);

    /*
    function _rtspRestart() {
        rtsp = new Rtsp();
        rtsp
            .on('data', function(data) {
                //console.log(new Date(),'frameUpdated', frameProcessed);
                frameData = data;
                frameUpdated = true;
                if (frameProcessed)
                    faceDetect(faceComplete)
            })
            .on('error', function() {
                setTimeout(function() {
                    rtsp.removeAllListeners();
                    rtspRestart()
                }, 5000)
            })
            .run(params);
    }
    */
    var lastFrameTime = new Date().getTime();

    function rtspRestart() {
        var conf = {
            input: params.camUrl
        };
        if (params.crop) conf.crop = params.crop;
        if (params.rate) conf.rate = params.rate;
        if (params.resize) conf.resize = params.resize;

        rtsp = new Rtsp2.FFMpeg(conf);

        rtsp.on('data', onFrameData)
    }

    function onFrameData(data) {
        frameData = data;
        frameUpdated = true;
        if (frameProcessed)
            faceDetect(faceComplete)
    }

    function nextJpeg() {
        var _time = (1000 / (params.rate || 5)) - (new Date().getTime() - lastFrameTime);
        //console.log(_time);
        if (_time < 0) _time = 0;
        setTimeout(mJpegRestart, _time);
    }

    function mJpegRestart() {
        var url = params.camUrl; // +'&'+new Date().getTime();
        if (url == 'webcam') return setTimeout(mJpegRestart, 5000);
        //console.log(url);
        lastFrameTime = new Date().getTime();
        //console.time('request');
        request({
            url: url,
            encoding: null
        }, function(e, r, body) {
            //console.log(r && r.statusCode);
            //console.timeEnd('request');

            if (e)
                return setTimeout(mJpegRestart, 5000);
            if (params.resize || params.crop) {
                var crop;
                if (params.crop)
                    crop = params.crop.split(':');
                else
                    crop = params.resize.split('x');

                return cropImage(new Buffer(body, 'binary'), {
                        w: crop[0],
                        h: crop[1],
                        x: crop[2],
                        y: crop[3]
                    })
                    .then(function(data) {
                        //faceDetect(new Buffer(data.replace('data:image/jpeg;base64,', ''), 'base64'), mJpegRestart);
                        onFrameData(new Buffer(data.replace('data:image/jpeg;base64,', ''), 'base64'));
                        nextJpeg()
                    })
            }

            //faceDetect(body, mJpegRestart);
            onFrameData(body);
            nextJpeg()
        });
    }

    if (/^http|^webcam$/.test(params.camUrl))
        mJpegRestart();
    else
        rtspRestart()

    if (!fs.existsSync(node_path + '/videos')){
        fs.mkdirSync(node_path + '/videos');
    }

    if (params.enableVideoRecording) {
      pm2.connect(function(err) {
        pm2.start({
            cwd: node_path + '/videos',
            script: 'ffmpeg',
            args: '-loglevel error -rtsp_transport tcp -i "' + params.videoRecordingSource + '" -f segment -segment_time 600 -segment_format mp4 -strict -2 -reset_timestamps 1 -strftime 1 -map 0 %Y%m%d-%H%M%S.mp4',
            name: 'video' + id,
        }, function(err, apps) {
          if (err) throw err
        });
      });
    }
    else {
      pm2.connect(function(err) {
        pm2.delete('video' + id, function(err) {
          pm2.disconnect();
        });
      });
    }



    /*
     */
    var testImage;
    var frameData;
    var frameUpdated = false;
    var frameProcessed = true;

    var frames = {
        prev: null,
        curr: null
    };

    checkLic();
    setInterval(checkLic, 60000);

    if (params.testImageFile) {
        require('fs').readFile(params.testImageFile, function(err, contents) {
            testImage = contents;
            //console.log(err, contents);
        });
    }

    function faceComplete(obj) {
        if (!obj || (obj && !obj.msg))
            frameProcessed = true;
        //console.log(new Date(),'faceComplete', frameUpdated);
        //console.timeEnd('faceDetect');

        if (frameUpdated)
            faceDetect(faceComplete);
    };

    function faceDetect(cb) {
        //console.time('faceDetect');
        var frame = frameData;
        frameUpdated = false;
        frameProcessed = false;

        if (testImage && params.testImage)
            frame = testImage;

        var image64 = 'data:image/jpeg;base64,' + new Buffer(frame).toString('base64');

        function onResult(obj) {
            var trustFaces = [];
            if (obj.action == 'face' &&
                obj.data &&
                obj.data.length) {

                obj.data.forEach(function(face) {
                    var evt = event(face, params, frame, wss);
                    //console.log(evt);
                    if (!evt)
                        evt = {
                            trustFace: false,
                            sendEvent: false
                        };
                    trustFaces.push(evt)
                });
                obj.data = obj.data.map(function(face, i) {
                    if (!trustFaces[i].trustFace) face.name = '*';
                    return face
                });
                //console.log('obj.data', obj.data);
                if (params.enableTrustedID) {
                    var face = obj.data[0];
                    face.sendEvent = trustFaces[0].sendEvent;
                    Faces.log(params, image64, face.image, face.id + '|' + face.name, face.sendEvent);
                }

                imageProcess(frame, obj.data)
                    .then(sendFrame)
                    .catch(function(e) {
                        //console.log(e)
                        if (cb) cb();
                    })
            } else {
                //if (obj.action != 'face') console.log(obj);
                sendFrame(frame, obj);
            }
            return trustFaces;
        }

        function sendFrame(frame, obj) {
            onStreamData(frame);

            if(params.motionDetection) {
                if (!frames.prev) {
                    frames.prev = frame;
                }
                frames.curr = frame;
                motionDetection(frames, params)
                    .then((motion) => {
                        wss.broadcast(motion, {
                            binary: false
                        });
                    });
                frames.prev = frames.curr;
            }

            wss.broadcast(frame, {
                binary: true
            });
            if (cb) cb(obj);
        }

        if (_lic && params.enableObjectDetect && params.enableTrustedID)
            TrustedID(frame, params, onResult);
        else
            sendFrame(frame);
    }
}

var recording = null;

loadSettings(settingsFile, start);

module.exports.app = app;
