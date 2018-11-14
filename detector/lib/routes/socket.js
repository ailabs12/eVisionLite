var WebSocket = require('ws');
module.exports = function(ws, req, onFrameData, params) {
    var wss = this;

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    ip = ip.split(',')[0];
    var wsKey = req.headers['sec-websocket-key'];
    console.log(`WS client connected from ${ip} ${wsKey}`)

    var completed = true;
    var lastFrameTime = new Date().getTime();

    ws.on('message', function(data) {
        try {
            var res = JSON.parse(data);
            //console.log(res);
            if (res.type !== 'audio')
               wss.saveSettings(res);
	    else {
	       if (res.action == 'answered')
		wss.incomingCall()	
	       if (res.action == 'hangUp')
		if (wss.hangUp) wss.hangUp()	
	    }
	      
        } catch (e) {
            if (wss.webcamKey && wss.webcamKey != wsKey) return;
            wss.webcamKey = wsKey;
            //console.log(e)
	    function onCompleted(){
                completed = true;
		if (ws && ws.readyState === WebSocket.OPEN)
		ws.send(JSON.stringify({completed:true}));
        	lastFrameTime = new Date().getTime();
	    };

            function nextFrame() {
                var _time = (1000 / (params.rate || 15)) - (new Date().getTime() - lastFrameTime);
                //console.log(_time);
                if (_time < 0) _time = 0;
                setTimeout(onCompleted, _time);
            }

	    if (!completed) return;
            completed = false;
	    //console.log(data);
	    try {		
               onFrameData(new Buffer(data.replace('data:image/jpeg;base64,', ''), 'base64'));
           } catch(e){}
	    nextFrame();
        }
    })
    ws.on('close', function(data) {
        wss.webcamKey = false;
        console.log('WS client disconnected');
        //faceItem.close();	
    });

    ws.on('error', function(err){
        console.log(err);
    });

};
