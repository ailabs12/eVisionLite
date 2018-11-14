var Canvas = require("./../canvas"),
    Image = Canvas.Image;

var img = new Image();

module.exports = function(urlData, coord) {
    return new Promise(function(resolve, reject) {

        img.onerror = function(err) {
            reject(err)
        }

        img.onload = function() {
            //console.log(img.width, img.height, coord.w, coord.h , coord.x, coord.y);

            var w = Number(coord.w);
            var h = Number(coord.h);

            var canvas = Canvas.createCanvas(w, h)
            var ctx = canvas.getContext('2d')

            ctx.imageSmoothingEnabled = true;

            if (!coord.x || !coord.y)
              ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h) ;
            else
              ctx.drawImage(img, Number(coord.x), Number(coord.y), w, h, 0, 0, w, h) ;

            canvas.toDataURL('image/jpeg', function(err, jpeg) {
                //console.log(jpeg.length)
		if (err) return reject(err); 
                resolve(jpeg);
            })
        }
        try {
            img.src = urlData;
        } catch (e) {
            console.log(e)
            reject(e);
        };

    })
}