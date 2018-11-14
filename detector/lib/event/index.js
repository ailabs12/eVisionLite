var request = require('request');
var mqtt = require('mqtt');
var onvifRelay = require('../onvifRelay');
var tcpCleint = require('../tcpClient');
var cropImage = require('../cropImage');
var voice = require('../voice');

var playEventTimeout = false;

var unknownCount = 0;
var minKnownCount = 0;
var meanKnownCount = 0;
var lastFace;

const EVENTTIMEOUT = 3; // sec

const MINACCCOUNT = 1; // number of additional confirmation frames (minAcc) 
const MEANACCCOUNT = 7; // number of additional confirmation frames (meanAcc)

const UNKNOWNCOUNT = 3; // number of unidentified frames to start registration

const FICETIMEOUT = 5; // sec

function resetCounts(){
    lastFace = null;
    minKnownCount = 0;
    meanKnownCount = 0;
//    unknownCount = 0;
}

function allowedTime(params) {
    if (!params.eventTime) return false;

    var m = params.eventTime.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/)
    if (m.length < 5) return false;

    var todayDate = new Date();
    //todayDate.setDate(todayDate.getDate() + 1);
    var day = todayDate.getDay();

    if (!params.eventWeekend && (day == 6 || day == 0)) return false;

    var startHour = Number(m[1]);
    var startMinute = Number(m[2]);
    var endHour = Number(m[3]);
    var endMinute = Number(m[4]);

    var startDate = new Date();
    startDate.setHours(startHour);
    startDate.setMinutes(startMinute);
    startDate.setSeconds(0);

    var endDate = new Date();
    endDate.setHours(endHour);
    endDate.setMinutes(endMinute);
    endDate.setSeconds(0);

    if (todayDate > startDate && todayDate < endDate) return true;
    return false;
}

var mqttClient;
var faceTimeOutID;

module.exports = function(face, params, frame, wss) {

    if (params.mqttUri && params.mqttTopic && !mqttClient) {
        mqttClient = mqtt.connect(params.mqttUri);
        mqttClient.on('connect', function() {
            console.log('Connected to mqtt server ' + params.mqttUri)
        });
    }


    console.log('Face detected:' + face.name, face.accuracy, lastFace, minKnownCount, meanKnownCount);

    //    if (!params.enableEvent && !params.enableRelay) return;
    //    if (!allowedTime(params)) return;

    if (lastFace !== face.name) resetCounts();

    clearTimeout(faceTimeOutID);
    faceTimeOutID = setTimeout(resetCounts, FICETIMEOUT * 1000);

    var name = face.name.split(':')[0];
    var access = !!(face.name.split(':')[1] == '1');

    if (face.accuracy >= params.minAccuracy &&
        face.accuracy <= params.trustAccuracy &&
        minKnownCount < (params.minAccCount || MINACCCOUNT)) {

        if (!lastFace) lastFace = face.name;

        if (lastFace == face.name)
            minKnownCount++;
        else
            minKnownCount = 0;

        lastFace = face.name;
        unknownCount = 0;
        //console.log('in minAccuracy');

        if (face.accuracy <= params.meanAccuracy) {
            meanKnownCount = 0;
            return;
        }
    }

    if (face.accuracy >= params.meanAccuracy &&
        face.accuracy <= params.trustAccuracy &&
        meanKnownCount < (params.meanAccCount || MEANACCCOUNT)) {

        if (!lastFace) lastFace = face.name;

        if (lastFace == face.name)
            meanKnownCount++;
        else
            meanKnownCount = 0;

        lastFace = face.name;
        unknownCount = 0;
        //console.log('in meanAccuracy');

        return;
    };

    if (face.accuracy < params.minAccuracy) {
    	minKnownCount = 0;
    	meanKnownCount = 0;

        if (name !== '*') return;
        if (!params.registration) return;

        if (unknownCount < (params.unknownCount || UNKNOWNCOUNT)) {
            unknownCount++;
            return;
        }
        unknownCount = 0;
    }

    resetCounts();
    unknownCount = 0;

    //console.log(face);
    
    var data = {
        access: access
    };

    if (name == '*'){
        data.name = name;
    } else {
        data.id = face.id;

    	var nick = name.split('|')[1] || '';
    	if (nick) 
	    data.name = nick;
    }	

    return sendEvent();

    function sendEvent() {

        if ((playEventTimeout) ||
            (!params.enableEvent && !params.enableRelay) ||
            (!allowedTime(params)))
            return {
                trustFace: (name !== '*'),
                sendEvent: false
            };

        setTimeout(function() {
            playEventTimeout = false
        }, (params.eventTimeout || EVENTTIMEOUT) * 1000);

        playEventTimeout = true;
        //var url = encodeURI(params.eventUrl + JSON.stringify(data));
        //console.log(url);
        //return;
        if (params.enableEvent && params.eventUrl) {
            function _request() {
                request.get({
                        url: params.eventUrl,
                        qs: data
                    },
                    function(err, res, body) {
                        console.log(body)
                    });
            }
            if (name == '*') {
                data.descriptor = face.face_encoding;
                if (params.registration)
                    cropImage(new Buffer(frame, 'binary'), face.coord)
                    .then(function(image) {
                        data.image = image;
                        _request()
                    });
            } else _request()

        }

        if (access && params.enableRelay && name !== '*') {
            if (params.device == 'SIGUR') {
                if (params.onvifUrl && params.acsPort && params.onvifUser && params.onvifPass && params.acsDeviceID && params.acsDirection)
                    tcpCleint.open(params);
                    wss.broadcast('actionOpen', {binary: false});
            } else {
                if (params.onvifUrl && params.onvifUser && params.onvifPass && params.onvifRelayOutputToken) {
                    onvifRelay(params).open();
                    wss.broadcast('actionOpen', {binary: false});
                }
            }
        }
            
        if (mqttClient && mqttClient.connected && name !== '*') mqttClient.publish(params.mqttTopic, data.id);
	console.log('params.sipUri',params.sipUri);
        if (params.sipUri) voice(params, data);

        return {
            trustFace: (name !== '*'),
            sendEvent: true
        }
    }
}