var fs = require('fs');
var enfsensure = require("enfsensure");
var WebSocketClient = require('../webSocketClient');
var findRemoveSync = require('find-remove');

var csv = require("fast-csv");
var rfs = require('rotating-file-stream');

var def_people_file = './testImage.db';
var def_people_face = './testImage.face.jpeg';

var peoples = [];
var face_encodings = [];
var face_ids = [];
var node_path = process.env.node_path || 'data';
var dataFile = node_path + '/persons.db';
var logFile = node_path + '/logs/log.csv';

var logsPath = node_path + '/logs/';
var logImagesPath = node_path + '/images/';
var personsImagesPath = node_path + '/persons/';
var logVideosPath = node_path + '/videos/';

function newID() {
    return uuid.v4().replace(/-/g, '');
}

function saveImageFile(imageFileName, imageData, imageId) {
    var imageData = imageData.replace('data:image/jpeg;base64,', '');
    return new Promise(function(resolve, reject) {
        enfsensure.ensureFile(imageFileName, {
            data: new Buffer(imageData, 'base64'),
            encoding: 0
        }, function(err) {
            if (err)
                reject(err);
            else
                resolve(imageId);
        });
    })
}

function logImage(imageData) {
    var logImageId = newID();
    var prefix = getDateFormat().substr(0, 10).replace(/\D/g, '')
    var imageFileName = logImagesPath + prefix + '/' + logImageId + '.jpeg';
    return saveImageFile(imageFileName, imageData, logImageId);
}

function addPersonImage(imageData, personId) {
    personId = personId || newID();
    var imageFileName = personsImagesPath + personId + '.jpeg';
    return saveImageFile(imageFileName, imageData, personId);
}

function load(file) {
    var rStream = fs.createReadStream(file);
    var data = [];
    return new Promise(function(resolve, reject) {
        csv
            .fromStream(rStream, {
                ignoreEmpty: true
            })
            .on("data", function(row) {
                data.push(row);
            })
            .on("error", function(e) {
                reject(e);
            })
            .on("end", function() {
                console.log("done");
                resolve(data);
                //console.log(people);
            });
    })
}

function getFileDate(id) {
    try {
        var info = fs.statSync(personsImagesPath + id + '.jpeg');
    } catch (e) {
        return ''
    }
    return getDateFormat(info.mtime).split('.')[0]; //birth //ctime
}

function getCsvData(face_ids, face_encodings, peoples) {
    // name, 128 face_encodings,base64 image
    var obj = [];
    if (face_encodings.length)
        face_encodings.forEach(function(face_encoding, i) {
            var row = []
            row.push(face_ids[i]);
            row.push(floatArrayToB64(face_encoding));
            row.push(peoples[i])
            obj.push(row)
        })
    return obj;
}

function saveObj(file, data) {
    //var logStream = fs.createWriteStream('log.txt', {'flags': 'a'});
    // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file

    var wStream = fs.createWriteStream(file);
    var csvStream = csv.createWriteStream({
        headers: false
    });
    csvStream.pipe(wStream);
    data.forEach(function(item) {
        csvStream.write(item)
    })
    csvStream.end();
    console.log('Data saved');
}

function getDateFormat(date, offset) {
    if (offset == undefined) offset = 3;
    var todayDate;
    try {
        todayDate = date ? new Date(date) : new Date();
    } catch (e) {
        todayDate = new Date();
    };
    todayDate.setHours(todayDate.getHours() + offset);
    return (new Date(todayDate)).toISOString().replace(/[TZ]/g, ' ').trim()
}

function getLog(file) {
    //var logStream = fs.createWriteStream(file, {flags:'a'});
    var path = require('path');

    file = /*path.join(__dirname + file)*/ file.split('/');

    var file_name = file.pop();
    var file_path = file.join('/');
    //console.log(file_name, file_path);

    var logStream = rfs(file_name, {
        path: file_path,
        size: '2M', // rotate every 10 MegaBytes written
        interval: '1d', // rotate daily
        //compress: 'gzip'
    });

    /*
    var logStream = require('file-stream-rotator').getStream(
        {
            filename:file,
            frequency:"custom",
            verbose: false,
            date_format: "YYYY-MM-DD",
            audit_file:file + '.csv',
            size: "1M" // its letter denominating the size is case insensitive
        }
    );
    */
    // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
    logStream.write("\n");

    var csvStream = csv.createWriteStream({
        headers: false
    });
    csvStream.pipe(logStream);
    return csvStream;
}


function save() {
    saveObj(dataFile, getCsvData(face_ids, face_encodings, peoples))
}

//save('', [[1,.2,.3],[2,.4,.5]]);

function floatArrayToB64(floatArray) {
    return new Buffer(new Float64Array(floatArray).buffer).toString('base64')
}

function b64ToFloatArray(str) {
    var buf = new Buffer(str, 'base64');
    var data = new Float64Array(buf.buffer, buf.offset, buf.byteLength / Float64Array.BYTES_PER_ELEMENT);
    return Array.prototype.slice.call(data);
}


function reload() {
    load(dataFile)
        .then(function(data) {
            data.forEach(function(row) {
                face_ids.push(row.shift());
                face_encodings.push(b64ToFloatArray(row.shift()));
                peoples.push(row.shift())
            })
            console.log('Reloaded')
        });
}

function _get() {
    return peoples.map(function(item, i) {
        var data = item.split(':');
        var names = data[0].split('|');
        return {
            id: face_ids[i],
            name: names[0],
            nick: names[1] || '',
            access: !!(data[1] == '1')
        }
    });
}

function get() {
    return _get().map(function(item, i) {
        item.date = getFileDate(face_ids[i])
        return item;
    });
};

function getLogData(query) {
    var file;
    if (!('step' in query)) query.step = '1';
    if (!('date' in query)) query.date = getDateFormat().substr(0, 10);

    query.date = query.date.replace(/\D/g, '')

    if (getDateFormat().substr(0, 10).replace(/\D/g, '') == query.date)
        file = logFile;
    else
        file = node_path + '/logs/' + query.date + '-0000-' + (query.step.length == 1 ? '0' + query.step : query.step) + '-log.csv';

    //console.log(file);

    if (!fs.existsSync(file))
        return new Promise(function(resolve, reject) {
            resolve([])
        })
    //file = logFile;

    var rStream = fs.createReadStream(file);
    var data = [];
    return new Promise(function(resolve, reject) {
        csv
            .fromStream(rStream, {
                ignoreEmpty: true
            })
            .on("data", function(row) {
                if ('image' in query) {
                    if (query.image == row[1])
                        data.push({
                            image: row[1],
                            descriptor: row[6]
                        })
                    return;
                }
                //console.log(row[0],row[1]);
                data.push({
                    date: row[0],
                    image: row[1],
                    id: row[2],
                    accuracy: row[3],
                    minAccuracy: row[4],
                    source: row[5],
                    //descriptor: row[6],
                    image_score: row[7],
                    image_type: row[8],
                    event_trust: row[9],
                    event_send: row[10]
                });
            })
            .on("error", function(e) {
                console.log(e);
                reject(e);
            })
            .on("end", function() {
                resolve(data);
                //console.log(people);
            });
    })
}

function getStaticPersonId(personId) {
    if (personId.split('').splice(-1) == '_') {
        var users = _get();
        var user = users.filter(function(item) {
            return item.id == personId
        });
        if (!user[0]) return personId;
        user = user[0];
        var id = users.filter(function(item) {
            return item.name == user.name && item.id.split('').splice(-1) != '_'
        });
        //console.log(user.name, id);
        if (!id[0]) return personId;
        return (id && id[0].id) || '';
    }
    return personId;
}

function autoUpdate(params) {
    var users = _get();

    var user = users.filter(function(item) {
        return item.id == params.id
    });
    if (!user[0]) return;
    user = user[0];

    var remove_ids = face_ids.filter(function(item, i) {
        if (users[i].name != user.name) return false;
        if (item.split('').splice(-1) != '_') return false;
        return true;
    })

    user.id = newID().split('').slice(0, -1).join('') + '_';
    user.image = params.image;

    //console.log(remove_ids, user);
    var name = user.name;
    if (remove_ids.length)
        remove(remove_ids.join(','));
    insert(user);
}

function update(params) {
    params.access = (params.access == '1');
    params.id.split(',').forEach(function(id) {
        var index = face_ids.indexOf(id);
        console.log('Update name:', id, params.name, params.access, ' index:', index);
        peoples[index] = params.name + '|' + (params.nick || '') + ':' + (params.access ? 1 : 0);
        //peoples[index] = params.name + ':' + (params.access ? 1 : 0);
    })
    save()
}

function remove(ids) {

    ids.split(',').forEach(function(id) {
        var index = face_ids.indexOf(id);
        console.log('Remove id:', id, ' index:', index);
        peoples.splice(index, 1);
        face_encodings.splice(index, 1);
        face_ids.splice(index, 1);

        var imageFileName = personsImagesPath + id + '.jpeg';
        fs.unlink(imageFileName, function(err) {
            if (err) console.log(err);
        });
    })

    save()
};

function insert(params) {

    params.name = params.name + '|' + (params.nick || '') + ':' + (params.access == '1' ? 1 : 0);
    //params.name = params.name + ':' + (params.access == '1' ? 1 : 0);

    var id = params.id || newID();

    console.log('Insert id:', id);

    var data = params.image.split('/');

    params.date = data.slice(-2, -1)[0];
    params.image = data.slice(-1)[0].split('.')[0];

    console.log('Insert', params.date, params.image, params.name);

    //TODO get data from saved
    getLogData(params)
        .then(function(data) {
            //console.log(data);
            if (!data[0]) return;

            params.descriptor = data[0].descriptor;

            face_encodings.push(b64ToFloatArray(params.descriptor));

            peoples.push(params.name);

            face_ids.push(id);

            var prefix = params.date.replace(/\D/g, '')
            var imageFileName = logImagesPath + prefix + '/' + params.image + '.jpeg';
            var personFileName = personsImagesPath + id + '.jpeg';

            fs.copyFile(imageFileName, personFileName, function(err) {
                if (err) console.log(err);
            });

            save()

        })
    return id
};

var _log = {
    write: function() {}
};

if (!fs.existsSync(logFile)) {
    enfsensure.ensureFile(logFile, {
        mode: "664"
    }, function(err) {
        if (!err) {
            _log = getLog(logFile);
        }
    });
} else _log = getLog(logFile);


var euclideanDistance = require('euclidean-distance')


function getDistance(face_encoding) {

    var maxDist = .1;
    var minDist = .7;

    var distances = [];

    var len = face_encodings.length;

    if (!len) return {}

    var index = 0;

    var value = euclideanDistance(face_encodings[0], face_encoding);
    distances.push(value);

    //for faster!!
    for (var i = 1; i < len; i++) {
        var distance = euclideanDistance(face_encodings[i], face_encoding);
        distances.push(distance);
        if (distance < value) {
            value = distance;
            index = i;
        }
    }

    var accuracy = (minDist - value) / (minDist - maxDist);

    if (accuracy > 1) accuracy = 1;
    if (accuracy < 0) accuracy = 0;

    var obj = {
        id: face_ids[index],
        accuracy: accuracy,
        dist: value
    };

    return obj;
}

var cropImage = require('../cropImage');

var uuid = require('node-uuid');

function init(url, _params) {
    var params = {};

    for (var k in _params)
        params[k] = _params[k];

    console.log(url);
    url = url || 'ws://localhost:9001';
    var autoReconnectInterval = 2000;

    var ready;
    //var imageData;

    setInterval(rotate, 3600000); // 1hour
    rotate();

    function rotate() {
        console.log('rotate:');
        var res = findRemoveSync(logsPath, { /*test:true,*/
            age: {
                seconds: 86400 * (params.dataStorageDays || 90)
            },
            extensions: '.csv',
        });
        res = Object.assign({}, res, findRemoveSync(logImagesPath, { /*test:true,*/
            age: {
                seconds: 86400 * (params.dataStorageDays || 90)
            },
            extensions: '.jpeg'
        }));
        res = Object.assign({}, res, findRemoveSync(logVideosPath, { /*test:true,*/
            age: {
                seconds: 86400 * (params.timeOfStorageOfVideo || 3)
            },
            extensions: '.mp4'
        }));

        if (Object.keys(res).length)
            console.log('removed files', res);
    };

    function verifyImage(landmarks) {

        var _l = landmarks[2]; //left
        var _c = landmarks[33]; //center
        var _r = landmarks[14]; //right

        var _lc = euclideanDistance(_l, _c);
        var _cr = euclideanDistance(_r, _c);

        var angleFace = Math.abs(Math.atan((_r[1] - _l[1]) / (_r[0] - _l[0])) * (180 / Math.PI)).toFixed(0)
        var fullFace = (Math.min(_lc, _cr) / Math.max(_lc, _cr) * 100).toFixed(0);

        var debug = 'Face angle:' + angleFace + ' max[' + params.maxAngel + ']  full: ' + fullFace + '% min[' + params.minFullFace + ']';
        console.log(debug);

        if (angleFace > params.maxAngel) return false;
        if (fullFace < params.minFullFace) return false;

        return true;
    }

    var onComplete = function() {};

    var client = new WebSocketClient();

    client.autoReconnectInterval = autoReconnectInterval;

    client.open(url);

    client.onopen = function() {
        console.log('Dlib server connected');
        ready = true;
    }

    client.onclose = function(e) {
        onComplete({
            action: 'error',
            data: {
                msg: 'Dlib server connection closed'
            }
        });
        console.log('Dlib server connection closed');
    }

    client.onerror = function(e) {
        console.log('error', e);
    }

    client.onmessage = function(message) {
        //console.log('Received: ' + message);
        ready = true;
        try {
            var res = JSON.parse(message);

            if (res.result !== 'success')
                return onComplete(res);

            var faceData = [];
            var tasks = [];
            var imageData = onComplete.imageData;

            res.data.face_locations.forEach(function(item, i) {
                if (!verifyImage(res.data.face_landmarks[i]))
                    return console.log('image skipped');

                coord = {};
                coord.x = item[3];
                coord.y = item[0];
                coord.w = item[1] - item[3];
                coord.h = item[2] - item[0];

                var face_encoding = res.data.face_encodings[i];

                var obj = getDistance(b64ToFloatArray(face_encoding));
                //if (imageData)
                //    tasks.push(cropImage(imageData, coord));
                if (imageData)
                    tasks.push(cropImage(imageData, coord));

                //tasks.push(Promise.resolve(imageData));
                //obj.accuracy = 0.02;

                if (!obj.accuracy || obj.accuracy < params.minAccuracy) {
                    obj.face_encoding = face_encoding;
                    obj.name = '*'
                } else {
                    obj.name = peoples[face_ids.indexOf(obj.id)];
                }
                //console.log(obj);
                obj.landmarks = res.data.face_landmarks[i];
                if (res.data.face_confidences)
                    obj.face_confidences = res.data.face_confidences[i]
                if (res.data.face_type)
                    obj.face_type = res.data.face_type[i]

                obj.coord = coord;

                faceData.push(obj);
            });

            var event =
                onComplete({
                    action: 'face',
                    minAccuracy: params.minAccuracy,
                    data: faceData
                });

            //console.log(event);

            if (params.enableLog)
                Promise
                .all(tasks)
                .then(function(images) {
                    images.forEach(function(image, i) {
                        logImage(image)
                            .then(function(logImageId) {
                                var prefix = getDateFormat().substr(0, 10).replace(/\D/g, '')
                                var imageFileName = logImagesPath + prefix + '/' + logImageId + '.full.jpeg';
                                //saveImageFile(imageFileName, imageData);
                                saveImageFile(imageFileName, imageData);

                                var id = getStaticPersonId(faceData[i].id);

                                if (params.autoUpdate && event[i].trustFace && event[i].sendEvent)
                                    autoUpdate({
                                        id: faceData[i].id,
                                        image: logImagesPath + prefix + '/' + logImageId + '.jpeg'
                                    });

                                faceData[i].id = id

                                //console.log('faceData[i].id',faceData[i].id);

                                _log.write([
                                    getDateFormat(),
                                    logImageId,
                                    ('id' in faceData[i]) ? faceData[i].id : '',
                                    faceData[i].accuracy,
                                    params.minAccuracy + ';' + params.meanAccuracy + ';' + params.trustAccuracy,
                                    params.camName || '',
                                    res.data.face_encodings[i],
                                    res.data.face_confidences[i],
                                    res.data.face_type[i],
                                    event[i].trustFace ? '1' : '0',
                                    event[i].sendEvent ? '1' : '0'
                                ]);
                            })
                    });
                });

        } catch (e) {
            //console.log(message.toString())
            console.log(e);
            onComplete({
                action: 'error',
                msg: e.toString()
            })
        }

    };

    function run(data, _params, cb) {
        for (var k in _params)
            params[k] = _params[k];

        //if (data) imageData = data;
        if (cb) onComplete = cb;
        if (data) onComplete.imageData = data;

        if (!ready)
            return cb({
                action: 'error',
                data: {
                    msg: 'Dlib server busy'
                }
            });

        if (client.instance.readyState == 1) {
            ready = false;
            client.send(data);
            //console.log('Send:', data)
            return
        }
        cb({
            action: 'error',
            data: {
                msg: 'Dlib server not connected'
            }
        });

    };

    return {
        run: run,
        close: function() {
            if (client) client.terminate()
        }
    }
}

//reload();

fs.exists(dataFile, function(exists) {
    if (exists)
        reload()
    else {
        enfsensure.ensureFile(dataFile, {
            stream: true,
            streamOptions: {
                autoClose: true
            }
        }, function(err, stream) {
            stream.on('finish', reload);
            fs.createReadStream(def_people_file).pipe(stream);
        })

        enfsensure.ensureFile(personsImagesPath + 'test_man_id.jpeg', {
            stream: true,
            streamOptions: {
                autoClose: true
            }
        }, function(err, stream) {
            fs.createReadStream(def_people_face).pipe(stream);
        })

    }
});

function externalLog(params,frame, imageData, name, access){
    console.log(frame, name, access);
    if (!params.enableLog) return;
    logImage(imageData)
        .then(function(logImageId) {
            var prefix = getDateFormat().substr(0, 10).replace(/\D/g, '')
            var imageFileName = logImagesPath + prefix + '/' + logImageId + '.full.jpeg';
            //saveImageFile(imageFileName, imageData);
            saveImageFile(imageFileName, frame);

            _log.write([
                getDateFormat(),
                logImageId,
                name,
                '',//accuracy
                params.minAccuracy + ';' + params.meanAccuracy + ';' + params.trustAccuracy,
                params.camName || '',
                '',
                '',
                '',
                '1',
                access ? '1' : '0'
            ]);
        })
}


module.exports = {
    reload: reload,
    get: get,
    insert: insert,
    update: update,
    remove: remove,
    getLog: getLogData,
    log:externalLog,
    init: init
}
