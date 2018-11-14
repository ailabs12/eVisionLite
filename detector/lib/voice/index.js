var mars = require('mars');
mars.events.removeListener('updateData', mars.events._events['updateData']);

/* remove original 'incomingCall' listener */
/*
var incallF = mars.events._events['incomingCall'];
if (Array.isArray(incallF)) incallF = incallF[0];
mars.events.removeListener('incomingCall', incallF);
*/

var sipAccounts;
var incomingSessionID;

function isConnected(wss){
  var ready = false;	    
  wss.clients.forEach(function(client) {
    if (client.readyState == 1) {
      ready = true;
    }
   })
   return ready;
}

module.exports = function(params, data, wss) {
    Object.keys(params).forEach(function(key) {
        if (/voice\./.test(key)) data[key] = params[key]
    });
    //console.log(/*params,*/ data);

    if (!sipAccounts) {
        /*
        mars.events.on('playBuffer', function(data){
           //console.log(data.data)
           wss.broadcast('msgPlayBuffer|'+ data.data.toString(), {
              binary: false
           }); 
        });

        mars.events.on('incomingCall', function(data){
          incomingSessionID = data.sessionID;
	  //console.log('incomingCall',data.sessionID);
          wss.incomingCall = function(){incallF(data)};
          wss.hangUp = function(){console.log('hangUp',data.sessionID)};
	  //console.log('isConnected', isConnected(wss))
	  if (!isConnected(wss)) return wss.incomingCall(); 
          wss.broadcast('msgIncomingCall', {
             binary: false
          }); 
        });

        mars.events.on('callEnded', function(data){
          if (data.sessionID == incomingSessionID)
	  //console.log('callEnded',data.sessionID);
          wss.broadcast('msgCallEnded', {
             binary: false
          })
        })
        */

        sipAccounts = {};
	sipAccounts[1] = {host:require('ip').address(), user:'1',password: '1',disable: 1};
        if (data['voice.sip_port']) sipAccounts[1].port = data['voice.sip_port'];
        if (data['voice.sip_gateway_host'] && data['voice.sip_gateway_login'] && data['voice.sip_gateway_password'])
            sipAccounts[2] = {
                host: data['voice.sip_gateway_host'],
                user: data['voice.sip_gateway_login'],
                password: data['voice.sip_gateway_password'],
                disable: 0
            };


        mars.events.onRequest('ivrData', function(param, cb) {
          var ivrData = []
          
          Object.keys(params).forEach(function(key) {
              if (/voice\.ivrMenu/.test(key) && params[key]) ivrData.push(params[key].split(','))
          });
          //console.log(ivrData);
          
          var _filter = [];
          
          ivrData.forEach(function(item) {
              _filter.push(item[0])
          });

        _filter = _filter.join('|');

            cb(null, {
                filter: _filter,
                data: ivrData,
		params: params
            })
        })

        setTimeout(function() {
            mars.events.config.set("recognize", {
                "type": "yandex",
                "options": {
                    "developer_key": data['voice.yandex_key'] || "",
                    "model": "general"
                }
            });
            mars.events.config.set("sipAccounts", sipAccounts);
            mars.events.emit('refresh', 'configData');
            mars.events.emit('refresh', 'tasks');
            toDo();
        }, 1000);
    } else toDo();

//console.log(data);
    function toDo() {
        if (data && (data.id || data.name=='*'))
            mars.events.emit('startScript', {
                sipAccountID: '1',
                uri: params.sipUri,
                script: 'invite.js',
                params: data
            });
    }
}