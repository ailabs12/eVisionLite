const WebSocketClient = require('../webSocketClient');
const onvifRelay = require('../onvifRelay');

module.exports = function(params, wss) {
    if (!params.streaming || !params.lic) return function(){};

    var active = false;
    var autoReconnectInterval = 2000,
        url = 'wss://media.evision.tech/stream/?id=' + params.lic;

    var client = new WebSocketClient();
    client.autoReconnectInterval = autoReconnectInterval;
    client.open(url);
    client.onopen = function() {
        console.log('Media server connected');
    }

    client.onclose = function(e) {
        console.log('Media server connection closed');
    }

    client.onerror = function(e) {
        console.log('error', e);
    }

    client.onmessage = function(message) {
        try {
            var res = JSON.parse(message);
            console.log('Streaming ' + message);
            if ('active' in res)
               active = res.active;
            if ('open' in res) {
               if (params.enableRelay && params.onvifUrl && params.onvifUser && params.onvifPass && params.onvifRelayOutputToken){
                   onvifRelay(params).open();
		   wss.broadcast('actionOpen', {binary: false});
               }
            }
        } catch (e) {}
    };

    return function(data) {
        if (active && client.instance.readyState == 1) {
            client.send(data);
        }
    }
}