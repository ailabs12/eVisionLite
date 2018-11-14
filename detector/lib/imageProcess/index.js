var Canvas = require("./../canvas")
    Image = Canvas.Image;

var scale = 1;
var drawLandmarks = true;

function drawCoordinates(context, x, y) {
    var pointSize = 1; // Change according to the size of the point.
    context.beginPath(); //Start path
    context.arc(x, y, pointSize, 0, Math.PI * 2, true); // Draw a point using the arc function of the canvas with a point structure.
    context.fill(); // Close the path and fill.
}

function drawFaces(context, faces) {
    if (!faces || !faces.forEach) return;
    faces.forEach(function(face) {
        drawFace(context, face);
    })
}

function drawFace(context, face) {
    //var coord = item.coord,

    var rect = face.coord,
        name = face.name,
        accuracy = face.accuracy || 0;
    if (rect)
        Object.keys(rect).forEach(function(key) {
            rect[key] = rect[key] * scale
        })

    //console.log(item.image);
    //context.font = '14px Helvetica';

    context.fillStyle = "#fff";
    if (drawLandmarks && face.landmarks)
        face.landmarks.forEach(function(point) {
            drawCoordinates(context, point[0] * scale, point[1] * scale);
        })

    if (name == '*') {
        context.strokeStyle = 'red';
        context.fillStyle = "red";
    } else {
        context.strokeStyle = '#1ed36f';
        context.fillStyle = "#fff";
    };
    name = name.split(':')[0].split('|')[0];

    if (rect) {
        context.strokeRect(rect.x, rect.y, rect.w, rect.h);
        
        context.fillText(name, rect.x + 5, rect.y + rect.h + 15);
        
        context.fillStyle = "#fff";
        
        var info = (accuracy * 100).toFixed(0) + '% [' + face.dist.toFixed(2) + ']'; // {' + face.id + '}';
        context.fillText(info, rect.x + 5, rect.y + rect.h + 30);
    } else
        context.fillText(name, 15, 15);
}

module.exports = function(frame, faces) {
    return new Promise(function(resolve, reject) {

        var image = new Image();

        image.onerror = function(e) {
            console.log(e);
            reject(e);
        };

        image.onload = function() {
            //console.log('loaded image',image.width,image.height);
            var width = image.width;
            var height = image.height;
            //return resolve(frame);
            var canvas = Canvas.createCanvas(width, height)
            var context = canvas.getContext('2d')

            context.imageSmoothingEnabled = true
            context.drawImage(image, 0, 0, width, height);
            drawFaces(context, faces);
            resolve(canvas.toBuffer());
        };

        console.time('frameImage');

        try {
            image.src = new Buffer(frame, 'binary');
        } catch (e) {
            console.log(e)
            reject(e);
        };

    })
}