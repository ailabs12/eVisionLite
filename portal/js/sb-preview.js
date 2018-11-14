(function($) {
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var host = window.document.location.host.replace(/:.*/, '');

    var params = {};
    location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(s, k, v) {
        params[k] = v
    })

    //console.log(params);
    let n = Object.keys(params).length;

    for (var key in params) {
        if (!(/^cam\d/.test(key))) return;
        startCam(key, params[key]);
    }

    if (n <= 4) {
        $('#cams9').hide();
        $('#cams12').hide();
        $('#cams4').show();
        n = 4
    } else if (n > 4 && n <= 9 ){
        $('#cams9').show();
        $('#cams12').hide();
        $('#cams4').hide();
        n = 9;
    } else if (n > 9 ){
        $('#cams9').hide();
        $('#cams12').show();
        $('#cams4').hide();
        n = 12;
    }


    function startCam(cam, port) {        
        $.ajax({
            type: 'GET',
            url: 'http://' + host + (port ? ':' + port : '') + '/api/settings',
            dataType: 'jsonp',
            success: function(json) {
                for (var key in json) params[key] = json[key];
                try {
                    $('#' + cam + n + 'span').text(params.camName);
                } catch (e) {
                    console.log(e)
                }
            },
            error: function(e) {
                console.log(e);
            }
        });
        //console.log(cam, port);
        //var host = 'localhost';
        var protocol = 'ws';
        var socket = new WebSocket(protocol + '://' + host + (port ? ':' + port : ''));

        socket.binaryType = "arraybuffer";

        socket.onopen = function() {
            console.log('onopen');
            //socket.send('test message');
        };

        socket.onerror = function(error) {
            console.log(error);
            // TODO : report error here..
        };

        var detectionTimeoutObj = {};

        socket.onmessage = function(message) {
            if (typeof message.data == 'string') {
                if (message.includes('movement')) {
                    if (message.includes('true')) {
                        clearTimeout(detectionTimeoutObj['#' + cam + n]);
                        $('#' + cam + n).css('outline', 'solid 2px red');
                        detectionTimeoutObj['#' + cam + n] = setTimeout(function() { 
                            $('#' + cam + n).css('outline', 'none'); 
                        }, 5000);                    
                    }
                    return;   
                }
                return;
            }
            var blob = new Blob([message.data], {
                type: "image/jpeg"
            });
            var urlCreator = window.URL || window.webkitURL;
            var imageUrl = urlCreator.createObjectURL(blob);
            $('#' + cam + n).attr("src", imageUrl);
        };
    }
    var imageUrl = 'images/image_not_found.png'; //'images/check.png';
    $('.center-row img').click(function(){window.parent.postMessage({message: $(this).attr('id')}, 'http://' + host);});
    $('.center-row2 img').click(function(){window.parent.postMessage({message: $(this).attr('id').slice(0, -1)}, 'http://' + host);});
    $('.center-row3 img').click(function(){window.parent.postMessage({message: $(this).attr('id').slice(0, -2)}, 'http://' + host);});
    //$('.center-row img').attr("src", imageUrl);
})(jQuery); // End of use strict