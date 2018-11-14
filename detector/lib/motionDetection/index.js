var Canvas = require("./../canvas")
    Image = Canvas.Image;


function applyThreshold(value, threshold) {
    return (value > threshold) ? true : false;
}

function frameDiff(prev, curr, options) {
    if (prev == null || curr == null) { return false; };

    const p = prev.data;
    const c = curr.data;

    var idxR, idxG, idxB;
    var diffR, diffG, diffB;
    var val;
    var count = 0;
    for (var idx = 0; idx < p.length; idx += 4) {
        idxR = idx + 0;
        idxG = idx + 1;
        idxB = idx + 2;
        diffR = Math.abs(p[idxR] - c[idxR]);
        diffG = Math.abs(p[idxG] - c[idxG]);
        diffB = Math.abs(p[idxB] - c[idxB]);
        if (applyThreshold(diffR / 255, options.pixelDiffThreshold)) count++;
        if (applyThreshold(diffG / 255, options.pixelDiffThreshold)) count++;
        if (applyThreshold(diffB / 255, options.pixelDiffThreshold)) count++;
    }

    return count / 4;  
}

function detect(frames, options) {
    var diff = frameDiff(frames.prev, frames.curr, options);

    if (!diff) { return 'movement: false'; };

    var totalPix = frames.curr.data.length / 4 ;

    if (diff / totalPix < options.movementThreshold) {
        return 'movement: false';
    } else {
        return 'movement: true';
    }
}


module.exports = function(frames, params) {
    return new Promise(function(resolve, reject) {

        var images = {
            prev: new Image(),
            curr: new Image()
        }

        var _movementThreshold;
        if (params.movementThreshold == 1) _movementThreshold = 0.001;
        else if (params.movementThreshold == 2) _movementThreshold = 1;
        else if (params.movementThreshold == 3) _movementThreshold = 3;
        else if (params.movementThreshold == 4) _movementThreshold = 10;
        else if (params.movementThreshold == 5) _movementThreshold = 20;

        images.prev.onerror = function(e) {
            console.log(e);
            reject(e);
        };

        images.curr.onerror = function(e) {
            console.log(e);
            reject(e);
        };

        images.curr.onload = function() {
            var options = {
                movementThreshold: _movementThreshold,
                pixelDiffThreshold: 0.4
            }
            var canvases = {
                prev: Canvas.createCanvas(320, 240),
                curr: Canvas.createCanvas(320, 240)
            }

            var ctxs = {
                prev: canvases.prev.getContext('2d'),
                curr: canvases.curr.getContext('2d')
            }

            ctxs.prev.drawImage(images.prev, 0, 0, images.prev.width, images.prev.height);
            ctxs.curr.drawImage(images.curr, 0, 0, images.curr.width, images.curr.height);

            var imageDatas = {
                prev: ctxs.prev.getImageData(0, 0, images.prev.width, images.prev.height),
                curr: ctxs.curr.getImageData(0, 0, images.curr.width, images.curr.height)
            }

            resolve(detect(imageDatas, options));
        };

        try {
            images.prev.src = new Buffer(frames.prev, 'binary');
            images.curr.src = new Buffer(frames.curr, 'binary');
        } catch (e) {
            console.log(e);
            reject(e);
        };

    })
}