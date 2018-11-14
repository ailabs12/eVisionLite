
var onvifRelay = require('../onvifRelay');
var tcpCleint = require('../tcpClient');

module.exports = function(app, params) {

    app.get('/api/open', function(req, res, next) {
        if (params.device == 'SIGUR') {
            if (!params.onvifUrl || !params.acsPort || !params.onvifUser || !params.onvifPass || !params.acsDeviceID || !params.acsDirection)
                return res.json({
                    success: false,
                    msg: "SIGUR parametrs not set"
                });
            tcpCleint.open(params);
            return res.json({
                success: true
            });
        } else {
            if (!params.onvifUrl || !params.onvifUser || !params.onvifPass || !params.onvifRelayOutputToken)
                return res.json({
                    success: false,
                    msg: "Onvif parametrs not set"
                });
                onvifRelay(params).open(); 
                return res.json({
                    success: true
                });
        }
    });

}