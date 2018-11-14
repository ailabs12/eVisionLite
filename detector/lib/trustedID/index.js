const request = require('request');
module.exports = function(image, params, onResult) {
    var formData = {
        type: "photo",
        key : params.lic,
        'file': {
            value: image,
            options: {
                filename: 'image',
                contentType: 'image/jpeg'
            }
        }
    };
    request.post({
        auth: {
            "user": params["trustedIDLogin"],
            "pass": params["trustedIDPassword"]
            //"sendImmediately": false
        },
        headers: {
            "accept": "application/json",
            "Content-Type": "multipart/form-data"
        },
        url: 'https://id.trusted.plus/idp/sso/user/authorize/auth',
        formData: formData
    }, function(error, response, body) {
        try {
            var res = JSON.parse(body);
            // console.log(res);
            if (!res.data || !res.data.userId)
                return onResult({});
            request.post({
                auth: {
                    "user": params["trustedIDLogin"],
                    "pass": params["trustedIDPassword"]
                    //"sendImmediately": false
                },
                headers: {
                    "accept": "application/json",
                    "Content-Type": "multipart/form-data"
                },
                url: 'https://id.trusted.plus/idp/sso/user/authorize/profile',
                formData: {
                    userId: res.data.userId
                }
            }, function(_error, _response, _body) {
                try {
                    var _res = JSON.parse(_body);
                    //console.log(res);
                    var obj = {};
                    obj.action = 'face';
                    var name = (_res.data && _res.data.displayName || res.data && res.data.userId);
                    obj.data = [{
                        image: res.data.image,
                        name: name + '|' + name + ':' + (res.success ? 1 : 0),
                        id: res.data && res.data.id
                    }];
                    //console.log(obj);
                    onResult(obj);
                } catch (e) {
                    onResult({})
                }
            })
        } catch (e) {
            onResult({})
        }
    });
}
