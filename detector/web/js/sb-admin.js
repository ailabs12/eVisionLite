(function($) {
    "use strict"; // Start of use strict
    // Configure tooltips for collapsed side navigation
    $('.navbar-sidenav [data-toggle="tooltip"]').tooltip({
        template: '<div class="tooltip navbar-sidenav-tooltip" role="tooltip"><div class="arrow"></div><div class="tooltip-inner"></div></div>'
    })
    // Toggle the side navigation
    $("#sidenavToggler").click(function(e) {
        e.preventDefault();
        $("body").toggleClass("sidenav-toggled");
        $(".navbar-sidenav .nav-link-collapse").addClass("collapsed");
        $(".navbar-sidenav .sidenav-second-level, .navbar-sidenav .sidenav-third-level").removeClass("show");
    });
    // Force the toggled class to be removed when a collapsible nav link is clicked
    $(".navbar-sidenav .nav-link-collapse").click(function(e) {
        e.preventDefault();
        $("body").removeClass("sidenav-toggled");
    });
    // Prevent the content wrapper from scrolling when the fixed side navigation hovered over
    $('body.fixed-nav .navbar-sidenav, body.fixed-nav .sidenav-toggler, body.fixed-nav .navbar-collapse').on('mousewheel DOMMouseScroll', function(e) {
        var e0 = e.originalEvent,
            delta = e0.wheelDelta || -e0.detail;
        this.scrollTop += (delta < 0 ? 1 : -1) * 30;
        e.preventDefault();
    });
    // Scroll to top button appear
    $(document).scroll(function() {
        var scrollDistance = $(this).scrollTop();
        if (scrollDistance > 100) {
            $('.scroll-to-top').fadeIn();
        } else {
            $('.scroll-to-top').fadeOut();
        }
    });
    // Configure tooltips globally
    $('[data-toggle="tooltip"]').tooltip()
    // Smooth scrolling using jQuery easing
    $(document).on('click', 'a.scroll-to-top', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: ($($anchor.attr('href')).offset().top)
        }, 1000, 'easeInOutExpo');
        event.preventDefault();
    });

    window.activeTab = 'Camera';
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var host = window.document.location.host.replace(/:.*/, '');
    var port = window.document.location.port;
    var protocol = 'ws' + (window.document.location.protocol == "https:" ? 's' : '');
    var socket = new WebSocket(protocol + '://' + host + (port ? ':' + port : '') + window.document.location.pathname);

    socket.binaryType = "arraybuffer";

    socket.onopen = function() {
        console.log('onopen');
        //socket.send('test message');
    };

    socket.onerror = function(error) {
        console.log(error);
        // TODO : report error here..
    };
    $('#callBtn').click(function() {
        $('#callBtn').hide();
        $('#hungUpBtn').show();
        socket.send(JSON.stringify({
            type: 'audio',
            action: 'answered'
        }))
    })
    $('#hungUpBtn').click(function() {
        $('#hungUpBtn').hide();
        socket.send(JSON.stringify({
            type: 'audio',
            action: 'hangUp'
        }))
    })

    function playBuffer(buffer) {

    }

    var detectionTimeout;

    socket.onmessage = function(message) {

        if (typeof message.data == 'string') {
            if (message.data.includes('movement')) {
                console.log(message.data);
                if (message.data.includes('true')) {
                    clearTimeout(detectionTimeout);
                    $('#videoCam').css('outline', 'solid 3px red');
                    detectionTimeout = setTimeout(function() {
                        $('#videoCam').css('outline', 'none');
                    }, 5000);
                }
                return;
            }
            // //console.log(message.data);
            var data = message.data.split('|');
            var text = data[0];

            if (text == JSON.stringify({
                    completed: true
                })) return startWebCam();
            if (text == 'actionOpen') return actionOpen();
            if (text == 'msgIncomingCall') return $('#callBtn').show();
            if (text == 'msgCallEnded') return $('#callBtn,#hungUpBtn').hide();
            if (text == 'msgPlayBuffer') return playBuffer(data[1]);

            if (text == 'msgLicNotDetected')
                text = 'Лицензионный ключ не задан!';
            if (text == 'msgLicNotFound')
                text = 'Лицензионный ключ не найден!';
            if (text == 'msgLicExpired')
                text = 'Истек срок действия лицензионного ключа!'
            if (text == 'msgLicInvalid')
                text = 'Лицензионный ключ не действителен!'
            if (text == 'msgLicDuplicate')
                text = 'Лицензионный ключ уже используется для камеры ' + (message.data.split('|')[1] || '') + '!'

            var keyLink = '<center><a target="_blank" href="https://cryptostore.ru/litsenziya-evision-id-trial">Получить демонстрационный ключ (бесплатно)</a></center>';
            keyLink += '<center><a target="_blank" href="https://cryptostore.ru/catalog/litsenziya-na-evision-id">Купить лицензионный ключ</a></center>'
            keyLink += '<br><center> <div class="form-group row"><label for="licInput" class="col-sm-2 col-form-label">Ключ:</label><div class="col-sm-9">'
            keyLink += '<input type="text" class="form-control" id="licInput" value="' + (params.lic || '') + '" placeholder="Введите ключ" oninput="updateLic(this.value)">'
            keyLink += '</div></div></center>';

            if (['msgLicNotDetected', 'msgLicNotFound', 'msgLicExpired', 'msgLicInvalid', 'msgLicDuplicate'].indexOf(message.data.split('|')[0]) !== -1)
                $("#infoModal")
                .find('.modal-body').html(text + '<br><br>' + keyLink);
            else
                $("#infoModal")
                .find('.modal-body').text(text);

            $("#infoModal").modal('show');
            //alert(message.data);
            return;
        }

        if (window.activeTab !== 'Camera') return;
        var blob = new Blob([message.data], {
            type: "image/jpeg"
        });
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL(blob);
        $('#videoCam').attr("src", imageUrl);
        if (window.stats)
	    stats.end();
        //img.src = message.data
    };

    function setSize() {
        var height = $(window).height();
        //$('#videoContainer').height($(window).height() - (height > 360 ? (140 - 50) : 85));
        $('#videoContainer').height($(window).height() - (height > 360 ? (140 - 50 + 15) : 85));
    }

    //$('#videoContainer').resizable({});

    $(window).resize(function() {
        setTimeout(function() {
            setSize();
        }, 0)
        console.log('resized', $(window).height());
    });

    setSize();

    function capture(video, scaleFactor) {
        if (scaleFactor == null) {
            scaleFactor = 1;
        }
        var w = video.videoWidth * scaleFactor;
        var h = video.videoHeight * scaleFactor;
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, w, h);
        return canvas;
    }

    var webCam = document.getElementById("camVideo");

    function initUserMedia(element, cb) {
        last_camUrl = params.camUrl;
        window.navigator.getUserMedia({
            video: true
        }, function(stream) {
            try {
                element.src = window.URL.createObjectURL(stream);
                setTimeout(cb, 1000);
            } catch (err) {
                element.src = stream;
                setTimeout(cb, 1000);
            }
        }, function() {
            alert('Нет доступа к web камере!');
        });
    };

    function sendImage(element, cb) {
        var image = capture(element).toDataURL('image/jpeg');
        //console.log(image);
        socket.send(image);
    }

    function initWebCam() {
        if (!webCam.src)
            initUserMedia(webCam, startWebCam);
        else
            startWebCam();
    }

    function startWebCam() {
        if (params.camUrl != 'webcam') return;
        sendImage(webCam);
    }
    //var params = {left:440, top:20, zoom: true};
    var params = {};

    function checkSpeechLic(params){
      console.log(params.enableVoice,params['voice.yandex_key'])
      if (!params.enableVoice) return;
      if (params['voice.yandex_key']) return;
      var keyLink = '<center><a target="_blank" href="https://cryptostore.ru/trial-licenzija-rechevye-tehnologii-Mars/">Получить демонстрационный ключ (бесплатно)</a></center>';
      keyLink += '<center><a target="_blank" href="https://cryptostore.ru/catalog/litsenziya-rechevye-tekhnologii">Купить лицензионный ключ</a></center>'
      keyLink += '<br><center> <div class="form-group row"><label for="licInputM" class="col-sm-2 col-form-label">Ключ:</label><div class="col-sm-9">'
      keyLink += '<input type="text" class="form-control" id="licInputM" value="' + (params['voice.yandex_key'] || '') + '" placeholder="Введите ключ" oninput="updateLicM(this.value)">'
      keyLink += '</div></div></center>';

      var text = 'Лицензионный ключ не задан!';

      $("#infoModal").find('.modal-body').html(text + '<br><br>' + keyLink);
      $("#infoModal").modal('show');

    };

    window.updateLic = function(data) {
        params.lic = data;
        updateParams()
    };
    window.updateLicM = function(data) {
        params['voice.yandex_key'] = data;
        updateParams()
    };
    var last_camUrl;

    function updateParams() {
        params.eventTimeout = Math.round(params.eventTimeout);
        params.knownCount = Math.round(params.knownCount);
        params.unknownCount = Math.round(params.unknownCount);
        params.dataStorageDays = Math.round(params.dataStorageDays);

        if (/^rtsp/.test(params.camUrl))
            params.videoRecordingSource = params.camUrl;
        socket.send(JSON.stringify(params));
        if (params.camUrl == 'webcam' && last_camUrl != params.camUrl) {
            last_camUrl = params.camUrl;
            initWebCam();
        }
    }

    function actionOpen() {
        $('#openBtn').prop("disabled", true);
        $('#openBtn').toggleClass('btn-success').toggleClass(' btn-danger');
        $('#openBtn').html('<i class="fa fa-unlock"></i><span class="nav-link-text"> Замок открыт</span>');

        setTimeout(function() {
            $('#openBtn').removeAttr('disabled');
            $('#openBtn').toggleClass('btn-success').toggleClass(' btn-danger');
            $('#openBtn').html('<i class="fa fa-lock"></i><span class="nav-link-text"> Открыть замок</span>');

        }, 2000);
    }

    $.ajax({
        type: 'GET',
        url: '/api/settings',
        dataType: 'jsonp',
        success: function(json) {
            for (var key in json) params[key] = json[key];
            try {
                if (params.camUrl == 'webcam') initWebCam();
                if (params.password) $('#logoutItem').show();
                if (params.onvifUrl) {
                    $('#appTab').prepend('<li class="navbar-brand text-center" data-toggle="tooltip" data-placement="right" title="Замок"><a class="btn btn-lg btn-success" id="openBtn" href="#Open" aria-controls="Open"><i class="fa fa-lock"></i><span class="nav-link-text"> Открыть замок</span></a></li>');
                    $('[data-toggle="tooltip"]').tooltip()
                    $('#openBtn').click(function() {
                        console.log("open clicked");
                        actionOpen();
                        $('[data-toggle="tooltip"]').tooltip()
                        $.ajax({
                            url: "/api/open",
                            success: function(text) {
                                console.log(text)
                            }
                        });
                    });
                }

                window.objectType = params.objectType;

                //console.log(params);
                params.reboot = function() {
                    console.log("restart clicked")
                };
                params.scud = function() {
                    console.log("scud clicked")
                };

                dat.GUI.TEXT_CLOSED = 'Закрыть настройки';
                dat.GUI.TEXT_OPEN = 'Открыть настройки';
                var gui = new dat.GUI({
                    width: 480
                }); //{ autoPlace: false }
                //$('#mainNav').append(gui.domElement);
                params.lic = params.lic || '';

                var accFolder = gui.addFolder('Доступ');
                accFolder.add(params, 'password').name('Пароль').onChange(updateParams);
                if ('web.port' in params)
                    accFolder.add(params, 'web.port').name('Порт').onChange(updateParams);

                var camFolder = gui.addFolder('Камера');
                camFolder.add(params, 'camName').name('Название').onChange(updateParams);
                camFolder.add(params, 'camUrl').name('<span title="Доступные значения: webcam&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; http://server/path rtsp://server/path">Сетевой адрес</span>').onChange(updateParams);
                camFolder.add(params, 'resize', {
                    'original': '',
                    '320x240': '320x240',
                    '640x480': '640x480',
                    '1280x720': '1280x720'
                }).name('Resize WxH').onChange(updateParams);
                camFolder.add(params, 'crop').name('Crop W:H:L:T').onChange(updateParams).listen();
                camFolder.add(params, 'rate', {
                    'original': '',
                    '1': 1,
                    '2': 2,
                    '3': 3,
                    '4': 4,
                    '5': 5
                }).name('Frame rate').onChange(updateParams);
                camFolder.add(params, 'vcodecCopy').name('vcodec copy').onChange(updateParams);

                var ftpFolder = camFolder.addFolder('Получение снимков по FTP');
                ftpFolder.add(params, 'enableFtp').name('Включить').onChange(updateParams);
                ftpFolder.add(params, 'ftpPort').name('FTP порт').onChange(updateParams);

                var detectionFolder = camFolder.addFolder('Детекция движения');
                detectionFolder.add(params, 'motionDetection').name('Включить').onChange(updateParams);
                detectionFolder.add(params, 'movementThreshold', ['1', '2', '3', '4', '5']).name('Чувствительность').onChange(updateParams);


                var vrFolder = gui.addFolder('Видеоархив');

                vrFolder.add(params, 'enableVideoRecording').name('Включить видеозапись').onChange(updateParams);
                vrFolder.add(params, 'videoRecordingSource').name('Сетевой адрес').onChange(updateParams).listen();
                vrFolder.add(params, 'timeOfStorageOfVideo', 1, 30, 1).name('Время хранения (сут.)').onChange(updateParams);

                var accessFolder = gui.addFolder('Управение доступом');

                var deviceFolder = accessFolder.addFolder('Тип устройства');
                deviceFolder.add(params, 'device', ['Beward', 'Dahua', 'ТЕТА', 'SIGUR', '...']).name('Устройство').onChange(updateParams);
                deviceFolder.add(params, 'enableRelay').name('Открывать при распознании').onChange(updateParams);

                if (params.device == 'Beward' || params.device == 'ТЕТА') {
                    var onvifFolder = deviceFolder.addFolder('Управление замком');
                    onvifFolder.add(params, 'onvifUrl').name('Сетевой адрес').onChange(updateParams);
                    onvifFolder.add(params, 'onvifUser').name('Логин').onChange(updateParams);
                    onvifFolder.add(params, 'onvifPass').name('Пароль').onChange(updateParams);
                    onvifFolder.add(params, 'onvifRelayOutputToken').name('Токен').onChange(updateParams);
                }

                if (params.device == 'Dahua') {
                    var dahuaFolder = deviceFolder.addFolder('Управление замком');
                    dahuaFolder.add(params, 'onvifUrl').name('Сетевой адрес').onChange(updateParams);
                    dahuaFolder.add(params, 'onvifUser').name('Логин').onChange(updateParams);
                    dahuaFolder.add(params, 'onvifPass').name('Пароль').onChange(updateParams);
                }

                if (params.device == 'SIGUR') {
                    var sigurFolder = deviceFolder.addFolder('Управление замком');
                    sigurFolder.add(params, 'onvifUrl').name('Сетевой адрес').onChange(updateParams);
                    sigurFolder.add(params, 'acsPort').name('Порт').onChange(updateParams);
                    sigurFolder.add(params, 'onvifUser').name('Логин').onChange(updateParams);
                    sigurFolder.add(params, 'onvifPass').name('Пароль').onChange(updateParams);
                    sigurFolder.add(params, 'acsDeviceID').name('ID устройства').onChange(updateParams);
                    sigurFolder.add(params, 'acsDirection', ['IN', 'OUT']).name('Направление').onChange(updateParams);
                }

                var serviceFolder = accessFolder.addFolder('Cервис авторизации');
                var trustedIDFolder = serviceFolder.addFolder('Сервис TrustedID');
                trustedIDFolder.add(params, 'enableTrustedID').name('Включить').onChange(updateParams);
                trustedIDFolder.add(params, 'trustedIDLogin').name('Логин').onChange(updateParams);
                trustedIDFolder.add(params, 'trustedIDPassword').name('Пароль').onChange(updateParams);

                // var eVisionIDFolder = serviceFolder.addFolder('Сервис eVisionID');
                // eVisionIDFolder.add(params, 'eVisionIDLogin').name('Логин').onChange(updateParams);
                // eVisionIDFolder.add(params, 'eVisionIDPassword').name('Пароль').onChange(updateParams);

                var eventsFolder = accessFolder.addFolder('График работы');
                eventsFolder.add(params, 'eventTime').name('Время работы (чч:мм-чч:мм)').onChange(updateParams);
                eventsFolder.add(params, 'eventWeekend').name('Выходные').onChange(updateParams);
                eventsFolder.add(params, 'enableEvent').name('Отправлять уведомления').onChange(updateParams);
                eventsFolder.add(params, 'eventTimeout', 0, 60, 1).name('Таймаут уведомлений (сек)').onChange(updateParams);
                eventsFolder.add(params, 'registration').name('Уведомление нераспоз. кадров').onChange(updateParams);

                if ('eventUrl' in params) {
                    eventsFolder.add(params, 'eventUrl').name('HTTP уведомление').onChange(updateParams);
                    eventsFolder.add(params, 'eventTimeout', 0, 60, 1).name('Таймаут уведомлений (сек)').onChange(updateParams);
                }

                if ('mqttUri' in params && 'mqttTopic' in params) {
                    eventsFolder.add(params, 'mqttUri').name('MQTT подключение').onChange(updateParams);
                    eventsFolder.add(params, 'mqttTopic').name('MQTT топик').onChange(updateParams);
                }

                // var trackingFolder = gui.addFolder('Трекинг');

                // var service2Folder = trackingFolder.addFolder('Cервис идентификации');
                // service2Folder.add(params, 'videoAnalytics2').name('Модуль видеоаналитики').onChange(updateParams);

                // var trustedID2Folder = service2Folder.addFolder('Сервис TrustedID');
                // trustedID2Folder.add(params, 'trustedIDLogin2').name('Логин').onChange(updateParams);
                // trustedID2Folder.add(params, 'trustedIDPassword2').name('Пароль').onChange(updateParams);

                // var eVisionID2Folder = service2Folder.addFolder('Сервис eVisionID');
                // eVisionID2Folder.add(params, 'eVisionIDLogin2').name('Логин').onChange(updateParams);
                // eVisionID2Folder.add(params, 'eVisionIDPassword2').name('Пароль').onChange(updateParams);

                var marsFolder = gui.addFolder('Cервис телефонии MARS');

                var SIPSettingsFolder = marsFolder.addFolder('Настройка SIP подключения');
                SIPSettingsFolder.add(params, 'sipUri').name('SIP адрес').onChange(updateParams);
                SIPSettingsFolder.add(params, 'voice.sip_port').name('SIP порт').onChange(updateParams);

                var SIPGatewayFolder = SIPSettingsFolder.addFolder('SIP шлюз');
                SIPGatewayFolder.add(params, 'voice.sip_gateway_host').name('IP адрес').onChange(updateParams);
                SIPGatewayFolder.add(params, 'voice.sip_gateway_login').name('Логин').onChange(updateParams);
                SIPGatewayFolder.add(params, 'voice.sip_gateway_password').name('Пароль').onChange(updateParams);

                var marsSettingsFolder = marsFolder.addFolder('Речевой сервис MARS');
                marsSettingsFolder.add(params, 'enableVoice').name('Включить речевые сервисы').onChange(function(){updateParams();checkSpeechLic(params);});
                marsSettingsFolder.add(params, 'voice.yandex_key').name('Лицензионный ключ').onChange(updateParams).listen();

                var marsVoiceFolder = marsSettingsFolder.addFolder('Меню голосового приветствия');
                marsVoiceFolder.add(params, 'voice.nightHour', 0, 24, 1).name('Час начала ночи').onChange(updateParams);
                marsVoiceFolder.add(params, 'voice.nightGreeting').name('Приветствие для ночи').onChange(updateParams);
                marsVoiceFolder.add(params, 'voice.morningHour', 0, 24, 1).name('Час начала утра').onChange(updateParams);
                marsVoiceFolder.add(params, 'voice.morningGreeting').name('Приветствие для утра').onChange(updateParams);
                marsVoiceFolder.add(params, 'voice.dayHour', 0, 24, 1).name('Час начала дня').onChange(updateParams);
                marsVoiceFolder.add(params, 'voice.dayGreeting').name('Приветствие для дня').onChange(updateParams);
                marsVoiceFolder.add(params, 'voice.eveningHour', 0, 24, 1).name('Час начала вечера').onChange(updateParams);
                marsVoiceFolder.add(params, 'voice.eveningGreeting').name('Приветствие для вечера').onChange(updateParams);
                marsVoiceFolder.add(params, 'voice.accessMessage').name('Фраза для лиц с доступом').onChange(updateParams);
                marsVoiceFolder.add(params, 'voice.accessDeniedMessage').name('Фраза для лиц без доступа').onChange(updateParams);
                marsVoiceFolder.add(params, 'voice.unknownMessage').name('Приветствие нераспоз. лиц').onChange(updateParams);

                var marsIVRFolder = marsSettingsFolder.addFolder('IVR меню');
                if ('voice.ivrQuestion' in params) {
                    marsIVRFolder.add(params, 'voice.ivrQuestion').name('IVR вопрос').onChange(updateParams);
                }
                if ('voice.ivrAnswer' in params) {
                    marsIVRFolder.add(params, 'voice.ivrAnswer').name('IVR подтверждение ответа').onChange(updateParams);
                }
                if ('voice.ivrNotAnswer' in params) {
                    marsIVRFolder.add(params, 'voice.ivrNotAnswer').name('IVR ответ не получен').onChange(updateParams);
                }
                if ('voice.ivrNotAvailable' in params) {
                    marsIVRFolder.add(params, 'voice.ivrNotAvailable').name('IVR абонент не доступен').onChange(updateParams);
                }
                if ('voice.ivrMenu0' in params) {
                    marsIVRFolder.add(params, 'voice.ivrMenu0').name('IVR меню 1').onChange(updateParams);
                }
                if ('voice.ivrMenu1' in params) {
                    marsIVRFolder.add(params, 'voice.ivrMenu1').name('IVR меню 2').onChange(updateParams);
                }
                if ('voice.ivrMenu2' in params) {
                    marsIVRFolder.add(params, 'voice.ivrMenu2').name('IVR меню 3').onChange(updateParams);
                }
                if ('voice.ivrMenu3' in params) {
                    marsIVRFolder.add(params, 'voice.ivrMenu3').name('IVR меню 4').onChange(updateParams);
                }
                if ('voice.ivrMenu4' in params) {
                    marsIVRFolder.add(params, 'voice.ivrMenu4').name('IVR меню 5').onChange(updateParams);
                }
                if ('voice.ivrMenu5' in params) {
                    marsIVRFolder.add(params, 'voice.ivrMenu5').name('IVR меню 6').onChange(updateParams);
                }
                if ('voice.ivrMenu6' in params) {
                    marsIVRFolder.add(params, 'voice.ivrMenu6').name('IVR меню 7').onChange(updateParams);
                }
                if ('voice.ivrMenu7' in params) {
                    marsIVRFolder.add(params, 'voice.ivrMenu7').name('IVR меню 8').onChange(updateParams);
                }
                if ('voice.ivrMenu8' in params) {
                    marsIVRFolder.add(params, 'voice.ivrMenu8').name('IVR меню 9').onChange(updateParams);
                }
                if ('voice.ivrMenu9' in params) {
                    marsIVRFolder.add(params, 'voice.ivrMenu9').name('IVR меню 10').onChange(updateParams);
                }

                var videoAnalyticsFolder = gui.addFolder('Видеоаналитика');
                videoAnalyticsFolder.add(params, 'enableObjectDetect').name('Включить распознавание объектов').onChange(updateParams);
                videoAnalyticsFolder.add(params, 'lic').name('Лицензионный ключ').onChange(updateParams).listen();
                var objectTypeFolder = videoAnalyticsFolder.addFolder('Детектор объектов');

                videoAnalyticsFolder.add(params, 'streaming').name('Доступ через моб. приложение').onChange(updateParams);

                var faceFolder = objectTypeFolder.addFolder('Лицо');
                faceFolder.add(params, 'maxAngel', 15, 45, 1).name('Макс. наклон (15-45)°').onChange(updateParams);
                faceFolder.add(params, 'minFullFace', 0, 100, 1).name('Мин. поворот лица (5-100)%').onChange(updateParams);
                faceFolder.add(params, 'minAccuracy', 0, 1, 0.01).name('Мин. уровень (0-1)').onChange(updateParams);
                faceFolder.add(params, 'minAccCount', 0, 10, 1).name('Число доп. кадров для мин. уров').onChange(updateParams);
                faceFolder.add(params, 'meanAccuracy', 0, 1, 0.01).name('Сред. уровень (0-1)').onChange(updateParams);
                faceFolder.add(params, 'meanAccCount', 0, 10, 1).name('Число доп. кадров для сред. уров').onChange(updateParams);
                faceFolder.add(params, 'trustAccuracy', 0, 1, 0.01).name('Дов. уровень (0-1)').onChange(updateParams);
                faceFolder.add(params, 'unknownCount', 0, 10, 1).name('Число доп. нераспоз. кадров').onChange(updateParams);
                faceFolder.add(params, 'autoUpdate').name('Автосохранение последнего кадра').onChange(updateParams);

                objectTypeFolder.add(params, 'enableLog').name('Логирование').onChange(updateParams);
                objectTypeFolder.add(params, 'dataStorageDays', 1, 366, 1).name('Время хранения истории (сут.)').onChange(updateParams);

                window.params = {
                    viewUnknown: false,
                    viewStats: false
                };

                var testFolder = gui.addFolder('Режим тестирования');
                testFolder.add(params, 'testImage').name('Включить режим тестирования').onChange(updateParams);
                testFolder.add(params, 'testImageFile').name('Тестовое изображение').onChange(updateParams);
                testFolder.add(window.params, 'viewUnknown').name('Показывать нераспознанных');
                testFolder.add(window.params, 'viewStats').name('Отображать FPS').onChange(function() {
                    if (window.params.viewStats) $('#stats').show();
                    else $('#stats').hide()
                });

                if ('scud_control' in params)
                    gui.add(params, 'scud').name('<a class="font-weight-bold" style="color: inherit;" href="/scud"><label><i class="fa fa-lock"></i> Модуль eVision Control Guard</label></a>');

                if (!('restart_disable' in params))
                    gui.add(params, 'reboot').name('<a data-toggle="modal" data-target="#restartModal"><i class="fa fa-fw fa-refresh"></i> Перезагрузка</a>');

                gui.close();

                $("#settingsLink").on('click', function() {
                    gui.closed ? gui.open() : gui.close()
                })

            } catch (e) {
                console.log(e)
            }
        },
        error: function(e) {
            console.log(e);
        }
    });

    $(".datepicker:not(#datepicker1)").datepicker({
        changeMonth: true,
        changeYear: true,
        firstDay: 1,
        showAnim: 'slideDown',
        dateFormat: 'yy-mm-dd',
        onSelect: (date) => {
            $('#historyTbl').bootstrapTable('refresh');
        }
    });

    $(".datepicker:not(#datepicker1)").datepicker("setDate", new Date());

    //gui.close();

    $('img#videoCam').imgAreaSelect({
        handles: true,
        onSelectEnd: onSelectEnd
    });

    function onSelectEnd(image, selection) {
        if (!selection.width) return;
        if (!selection.height) return;

        var x1 = Math.round(image.naturalWidth * (selection.x1 / image.width));
        var y1 = Math.round(image.naturalHeight * (selection.y1 / image.height));
        var width = Math.round(image.naturalWidth * (selection.width / image.width));
        var height = Math.round(image.naturalHeight * (selection.height / image.height));
        if (!width) return;
        if (!height) return;

        params.crop = [width, height, x1, y1].join(':');
        updateParams();
        console.log(params.crop);
    }

})(jQuery); // End of use strict
