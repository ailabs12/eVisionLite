var onvif = require('./node-onvif');
var request = require('request');

module.exports = function(params) {
    var debug = true;
    function init() {
        // Create an OnvifDevice object
       return new onvif.OnvifDevice({
            xaddr: params.onvifUrl, //'http://172.17.2.112:2000/onvif/device_service',
            user: params.onvifUser, //'admin',
            pass: params.onvifPass, //'admin'
        });
    }

    function open() {
        if (params.device == 'Dahua') {
            // request.get(params.onvifUrl, {
            //     'auth': {
            //         'user': params.onvifUser,
            //         'pass': params.onvifPass,
            //         'sendImmediately': false
            //     }
            // });
            require('./dahua')(params);
        } else {
            if (!params.onvifUrl || !params.onvifUser || !params.onvifPass || !params.onvifRelayOutputToken)
            return console.log('Onvif parametrs not found');

            var device = init();
            var RelayOutputToken = params.onvifRelayOutputToken //'RelayOutputs0';
            var DelayTime = params.onvifDelayTime || 2;
            var paramsOpen = {
                RelayOutputToken: RelayOutputToken,
                Mode: 'Monostable',
                DelayTime: 'PT' + DelayTime + 'S',
                IdleState: 'open'
            };
            var paramsClosed = {
                RelayOutputToken: RelayOutputToken,
                Mode: paramsOpen.Mode,
                DelayTime: paramsOpen.DelayTime,
                IdleState: 'closed'
            };

            var paramsActive = {
                RelayOutputToken: RelayOutputToken,
                state: 'active'
            };

            var paramsInactive = {
                RelayOutputToken: RelayOutputToken,
                state: 'inactive'
            };
            if (params.device == 'Beward') 
                device.services.device.setRelayOutputSettings(paramsOpen, function(err, result) {
                    if (err) return console.log(err);
                    setTimeout(function() {
                        device.services.device.setRelayOutputSettings(paramsClosed, function(err, result) {
                            if (debug) setState();
                        });
                    }, DelayTime * 1000);
                    setState()
                });
            else
                device.services.device.SetRelayOutputState(paramsOpen, function(err, result) {
                    if (err) return console.log(err.toString());
                    setTimeout(function() {
                        device.services.device.SetRelayOutputState(paramsClosed, function(err, result) {
                            if (debug) setState();
                        });
                    }, DelayTime * 1000);
                    setState()
                });

            function setState() {
                device.services.device.getRelayOutputs(function(err, result) {
                    if (debug) console.log(err, result.data.GetRelayOutputsResponse);
                    //token = result.data.GetRelayOutputsResponse.RelayOutputs['$'].token;
                });
            }
        }

    }
    return {
        open: open
    }
}