const { classifyImg } = require('object_detector_cocossd');

module.exports = function(image, params, onResult) {
    let image64 = 'data:image/jpeg;base64,' + new Buffer(image).toString('base64');
    let objects = classifyImg(image64);
    let result = [];

    for (i = 0; i < objects[0].length; i++) {
        if (!objects[0][i]) return;
        let item = {
            action: 'face',
            name: objects[0][i].className,
            dist: objects[0][i].confidence,
            accuracy: objects[0][i].confidence,
            coord: {
                x: objects[0][i].topLeft.x,
                y: objects[0][i].topLeft.y,
                w: objects[0][i].bottomRight.x - objects[0][i].topLeft.x,
                h: objects[0][i].bottomRight.y - objects[0][i].topLeft.y,
            }
        }
        result.push(item);
    }

    if (objects[1]) {
        for (i = 0; i < objects[1].length; i++) {
            if (!objects[1][i]) return;
            let item = {
                action: 'face',
                name: objects[1][i].className,
                dist: objects[1][i].confidence,
                accuracy: objects[1][i].confidence,
                coord: {
                    x: objects[1][i].topLeft.x,
                    y: objects[1][i].topLeft.y,
                    w: objects[1][i].bottomRight.x - objects[1][i].topLeft.x,
                    h: objects[1][i].bottomRight.y - objects[1][i].topLeft.y,
                }
            }
            result.push(item);
        }
    }

    onResult( {
        action: 'face',
        minAccuracy: params.minAccuracy,
        data: result
    } );
}