/**
 * Created by Andrew D.Laptev<a.d.laptev@gmail.com> on 30.03.15.
 */

const spawn = require('child_process').spawn
	, EventEmitter = require('events').EventEmitter
	, util = require('util')
	;

/**
 * Stream constructor
 * @param {object} options
 * @param {string} options.input Stream uri, for example rtsp://r3---sn-5hn7su76.c.youtube.com/CiILENy73wIaGQnup-1SztVOYBMYESARFEgGUgZ2aWRlb3MM/0/0/0/video.3gp
 * @param {number|string} [options.rate] Framerate
 * @param {string} [options.resolution] Resolution in WxH format
 * @param {string|number} [options.quality] JPEG quality
 * @param {Array<string>} [options.arguments] Custom arguments for ffmpeg
 * @constructor
 */
var FFMpeg = function(options) {
	if (options.input) {
		this.input = options.input;
	} else {
		throw new Error('no `input` parameter');
	}
	this.rate = options.rate || 5;
	this.resolution = options.resolution;
	this.resize = options.resize
        this.crop = options.crop;
	this.quality = (options.quality === undefined || options.quality === "") ? 3 : options.quality;

	this.arguments = options.arguments || [];
	this.imageData = []; // Store the entire data image into this variable. This attribute is replaced each time a full image is received from the stream.

	this.on('newListener', newListener.bind(this));
	this.on('removeListener', removeListener.bind(this));
	if (Object.observe && (typeof Proxy !== 'function')) {
		Object.observe(this, observer.bind(this));
	}
};

util.inherits(FFMpeg, EventEmitter);

/**
 * FFMpeg command name
 * @type {string}
 */
FFMpeg.cmd = 'ffmpeg';

function newListener(event) {
	if (event === 'data' && this.listeners(event).length === 0) {
		this.start();
	}
}

function removeListener(event) {
	if (event === 'data' && this.listeners(event).length === 0) {
		this.stop();
	}
}

function observer(changes) {
	if (changes.some(function(change) {
		return change.type === 'update';
	})) {
		this.restart();
	}
}

FFMpeg.prototype._args = function() {
	return this.arguments.concat([
		'-loglevel', 'quiet'
		, '-i', this.input
		/*, '-r', this.rate.toString()*/]
		, this.rate ? ['-r', this.rate.toString()] :[]
		, this.quality ? ['-q:v', this.quality.toString()] : []
		, this.resize && !this.crop ? ['-filter:v', 'scale=' + this.resize.replace('x',':')] : []
		, this.crop ? ['-filter_complex', 'crop=' + this.crop.toString()] : [],
	[
		//, '-vf', 'fps=25'
		//, '-b:v', '32k'
		'-f', 'image2'
		, '-update', '1'
		, '-'
	]
	, this.resolution ? ['-s', this.resolution] : []);
};

/**
 * Start ffmpeg spawn process
 */
FFMpeg.prototype.start = function() {
	var self = this;
	//console.log(FFMpeg.cmd + ' ' + this._args().join(' '));
	this.child = spawn(FFMpeg.cmd, this._args());
	this.child.stdout.on('_data', function(data){
		//The image can be composed of one or multiple chunk when receiving stream data.
		//Store all bytes into an array until we meet flag "FF D9" that mean it's the end of the image then we can send all data in order to display the full image.
		for(var idx = 0; idx < data.length-1;idx++){
			offset = data[idx].toString(16);
			offset2 = data[idx+1].toString(16);

			if(offset == "ff" && offset2 == "d9"){
				self.imageData.push(data[idx]);
				self.imageData.push(data[idx+1]);
				self.emit('data', Buffer.from(self.imageData));
				self.imageData = [];
				self.dataReceived = true;
			}else{
				self.imageData.push(data[idx]);
			}
		}
	});
    this.child.stdout.on('data', function(data){
    //console.log('data',data.length);
    //The image can be composed of one or multiple chunk when receiving stream data.
    //Store all bytes into an array until we meet flag "FF D9" that mean it's the end of the image then we can send all data in order to display the full image.
    for(var idx = 0; idx < data.length;idx++) self.imageData.push(data[idx])
    var _end;
    for(var idx = 0; idx < self.imageData.length-1;idx++){
        var offset = self.imageData[idx].toString(16);
        var offset2 = self.imageData[idx+1].toString(16);
        if(offset == "ff" && offset2 == "d9") {
	_end = idx;
	//break;
        }
    }
    if (_end) {
        var _buff = Buffer.from(self.imageData.splice(0,_end+2));
        self.imageData.splice(0,2);
        //console.log('_buff',_buff.toString('base64'));
        //console.log(_buff[0],_buff[1], _buff[2],'...',_buff[_buff.length - 3],_buff[_buff.length - 2],_buff[_buff.length - 1]);
        if (_buff[1] != '0xD8')	    
        _buff  = Buffer.concat([Buffer.from(['0xFF','0xD8']), _buff])
        //console.log(_buff[0],_buff[1], _buff[2],'...',_buff[_buff.length - 3],_buff[_buff.length - 2],_buff[_buff.length - 1]);

        self.emit('data', _buff);

        //else(console.log(_buff[2],_buff[3],_buff[4],_buff[5],_buff[6]))
            }
    self.dataReceived = true;

    });
	this.child.stderr.on('data', function(data) {
		throw new Error(data);
	});
	this.emit('start');
	this.child.on('close', function(code) {
		if (code === 0) {
			setTimeout(FFMpeg.prototype.start.bind(this), 1000);
		}
	}.bind(this));

	if (this.restartObserver) clearInterval(this.restartObserver);
	this.restartObserver = setInterval(function(){if (!self.dataReceived) {self.restart();console.log('Data not received. Restarting...');}; self.dataReceived = false;}, 10000);

	/*this.child.on('error', function(code) {
	});*/
};

/**
 * Stop ffmpeg spawn process
 */
FFMpeg.prototype.stop = function() {
	this.child.kill();
	delete this.child;
	clearInterval(this.restartObserver);
	this.emit('stop');
};

/**
 * Restart ffmpeg spawn process
 */
FFMpeg.prototype.restart = function() {
        //console.log('FFMpeg restart');
	if (this.child) {
		this.stop();
		this.start();
	}
};

if (typeof Proxy === 'function') {
	FFMpeg = new Proxy(FFMpeg, {
		set: function(target, property) {
			if (property !== 'super_' && target[property] !== undefined) {
				target.restart();
			}
			return true;
		}
	});
}

module.exports.FFMpeg = FFMpeg;