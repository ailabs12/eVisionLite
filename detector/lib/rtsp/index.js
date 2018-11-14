const ffmpeg = require('fluent-ffmpeg');
const EventEmitter = require("events").EventEmitter;

class rtspSnapshot extends EventEmitter {
    constructor() {
        super()
    }
    run(params) {
        var chunks = [],
            frame,
            _this = this;
        if (!params.camUrl) return _this.emit('error', 'Params "camUrl" not found')

        var rtsp = ffmpeg(params.camUrl);
        _this.kill = function(){rtsp.kill()};

        if (params.crop)
            rtsp.complexFilter(['crop=' + params.crop]);

        rtsp
            .format('image2');

        if (!params.crop && params.resize)
            rtsp.size(params.resize);// || '320x240');

	var outputOptions = [];

        if (params.vcodecCopy)
	    outputOptions.push('-vcodec copy');
	outputOptions.push('-r 2');
	outputOptions.push('-updatefirst 1');

        rtsp
            .outputOptions(outputOptions)
	    .on('start', function(commandLine, stderrLine) {
    		 console.log('Spawned Ffmpeg with command: ' + commandLine)
	    })
            .on('error', function(e) {
		console.log(e)
                _this.emit('error', e)
            })
            .on('progress', function(progress) {
                //console.log(progress);
                if (frame && frame != progress.frames) {
                    var snapshot = Buffer.concat(chunks);
                    chunks = [];
                    frame = progress.frames;
                    //console.log(snapshot.length,frame);
                    _this.emit('data', snapshot)
                    return;
                }
                if (!frame) frame = progress.frames;
                //console.log('Processing: ');
                //console.log(progress.frames);
            })
            .pipe()
            .on('data', function(chunk) {
                if (frame) chunks.push(chunk);
                //console.log('ffmpeg just wrote ' + chunk.length + ' bytes');
            })
    }
}

module.exports = rtspSnapshot