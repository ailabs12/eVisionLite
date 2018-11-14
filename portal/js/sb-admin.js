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


    function setSize() {
        var height = $(window).height();
        $('#videoContainer').height($(window).height() - (86 - 28));
    }

    //$('#videoContainer').resizable({});

    $(window).resize(function() {
        setTimeout(function() {
            setSize();
        }, 0)
        console.log('resized', $(window).height());
    });

    setSize();

    var maxNodes = 12;
    var nodeIndx = 0;

    while (nodeIndx++ < maxNodes)
        $("#navbarResponsive ul.camNav").append(
            '<li class="nav-item" id="cam' + nodeIndx + '">' +
            '<button class="camBtn navbar-brand mr-lg-2 btn btn-outline-primary" title="Камера ' + nodeIndx + '"><i class="fa fa-video-camera"></i><span class="camInfo">' + nodeIndx + '</span></button>' +
            '</li>');

    
    $("#navbarResponsive ul.camPrewiev").prepend(
        '<li class="nav-item" id="camPreview">' +
        '<button class="camBtn navbar-brand mr-lg-2 btn btn-outline-primary preview" title="Просмотр камер"><i class="fa fa-video-camera"></i> <i class="fa fa-video-camera"></i>' + "\n" + '<i class="fa fa-video-camera"></i> <i class="fa fa-video-camera"></i></button>' +
        '</li>');
    
    //$("#metaCam").attr('title', 'Максимальное количество камер ' + maxNodes);

    $("[title]").tooltip();

    $("#nodeFrame")
        .contents()
        .find('html')
        .css('margin', '0')
        .html('<img src="images/preloader.gif" style="position:absolute;margin:auto;top:0;left:0;bottom:0;right:0;">');

    $("#addCam").click(function() {
        if ($('#cpuUsage').hasClass('text-danger') || $('#memUsage').hasClass('text-danger'))
        return alert('Недостаточно свободных ресурсов для добавления камеры!'); 
        $('#addCamModal').modal('show');
    });

    $('#addCamModal').on('hidden.bs.modal', function(){
        $('#inputDeviceNameDiv').hide();
        $('#inputIPAdressDeviceDiv').hide();
        $('#inputLoginDeviceDiv').hide();
        $('#inputPasswordDeviceDiv').hide();
        $('#inputObjectTypeDiv').hide();
        $(this).find('form')[0].reset();
    });

    $('#inputDeviceNameDiv').hide();
    $('#inputIPAdressDeviceDiv').hide();
    $('#inputLoginDeviceDiv').hide();
    $('#inputPasswordDeviceDiv').hide();
    $('#inputObjectTypeDiv').hide();

    $('#inputDevice').change(function() {
        switch ($(this).val()) {
            case '-- Выберите устройство --': break;
            default:
                $('#inputDeviceNameDiv').show();
                $('#inputIPAdressDeviceDiv').show();
                $('#inputLoginDeviceDiv').show();
                $('#inputPasswordDeviceDiv').show();
                $('#inputObjectTypeDiv').show();
                break;
        }
    }); 

    $('#addCamM').click(function() {
        $("#addCamModal").modal('hide');
        socket.send(JSON.stringify({
            action: 'startNextNode',
            device : {
                name: $('#inputDeviceName').val(),
                url: $('#inputIPAdressDevice').val(),
                login: $('#inputLoginDevice').val(),
                password: $('#inputPasswordDevice').val(),
                device: $('#inputDevice').val(),
                comment: $('#inputCommentDevice').val(),
                objectType: $("input:radio[name ='optradio']:checked").val()
            }
        }));
    });

    $("#removeCam").click(function() {
        var id = $('.camBtn[active]').parent().attr('id').replace('cam', '');

        socket.send(JSON.stringify({
            action: 'stopNode',
            node: id
        }));

        $("#cam" + id).hide();
        $("#cam" + id).attr("data-url", "");
        conf[id] = 0;
        $('button', $("#navbarResponsive ul li:not(:hidden)").first()).click();
        updatePreview();
    });

    function showPreview() {
        if ($("#navbarResponsive ul li:not(:hidden):not(#camPreview)").length > 2)
            $('#camPreview').show();
        else
            $('#camPreview').hide();
    }

    $(".camBtn").click(function() {
        $(".camBtn").removeAttr('active');
        $(this).attr('active', '');
        $('.camBtn[active]').removeClass("btn-outline-primary").addClass("btn-primary");
        $('.camBtn:not([active])').removeClass("btn-primary").addClass("btn-outline-primary");
        $('#nodeFrame').attr("src", $(this).parent().attr('data-url'));

    });

    $("#authSettings").click(function() {
        $('#authSettingsModal').modal('show');
    });

    $('#changeSettings').click(function() {
        $("#authSettingsModal").modal('hide');
        socket.send(JSON.stringify({
            action: 'settingsChange',
            settings : {
                login: $('#inputNewLogin').val(),
                passwordNew: $('#inputNewPassword').val(),
                passwordOld: $('#inputOldPassword').val()
            }
        }));
    });

    $('#changeSettings').on('hidden.bs.modal', function(){
        $(this).find('form')[0].reset();
    });

    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var host = window.document.location.host.replace(/:.*/, '');
    var port = window.document.location.port;
    var protocol = 'ws' + (window.document.location.protocol == "https:" ? 's' : '');
    var socket = new WebSocket(protocol + '://' + host + (port ? ':' + port : '') + window.document.location.pathname);

    socket.onopen = function() {
        console.log('onopen');
        //socket.send('test message');
    };

    socket.onerror = function(error) {
        console.log(error);
        // TODO : report error here..
    };

    var blinkIntervals = {};
    var conf = {};

    function updatePreview() {
        var preViewsParams = [];
        for (var id in conf)
            if (conf[id]) {
                var faceid_port = conf[id];
                preViewsParams.push('cam' + id + '=' + conf[id]);
            }

        if (preViewsParams.length > 1) {
            $('#camPreview').show();
            $('#camPreview').attr("data-url", "preview.html?" + preViewsParams.join('&'));
        } else {
            $('#camPreview').hide();
        }
            $('.camReport').attr("data-url", "reports.html?" + preViewsParams.join('&'));
    }

    socket.onmessage = function(message) {
        try {
            var data = JSON.parse(message.data);
            //console.log(data);

            if (data.state) {
                conf = data.state;
                for (var id in conf)
                    if (conf[id]) {
                        var faceid_port = conf[id];
                        $("#cam" + id).show();
                        $("#cam" + id).attr("data-url", "http://" + host + ":" + faceid_port);
                        if (id == 1) {
                            var element = $("#cam" + id + " button");
                            element.attr("active", "");
                            element.removeClass("btn-outline-primary").addClass("btn-primary");
                            $("#nodeFrame").attr("src", $("#cam" + id).attr('data-url'));
                        }
                    }
                updatePreview();
            }

            if (data.status == 'starting') {
                var id = data.node;
                blinkIntervals[data.id] = setInterval(function() {
                    var element = $("#cam" + id);
                    //element.hide();
                    element.css('opacity', 0)

                    setTimeout(function() {
                        //element.show();
                        element.css('opacity', 1)
                    }, 300)
                }, 600);

            }

            if (data.status == 'started') {
                var id = data.node;
                var faceid_port = data.port;
                conf[id] = faceid_port;

                if (blinkIntervals[data.id])
                    clearInterval(blinkIntervals[data.id]);

                $("#cam" + id).show();
                $("#cam" + id).attr("data-url", "http://" + host + ":" + faceid_port);

                var active_id = $('.camBtn[active]').parent().attr('id').replace('cam', '');
                if (id == active_id)
                    $("#nodeFrame").attr("src", $("#cam" + active_id).attr('data-url'));
                updatePreview();
            }

            if (data.message) alert(data.message);

        } catch (e) {}
    }

window.addEventListener('message', function(event) {
      if(event.origin === 'http://'+host){
        //alert('Received message: ' + event.data.message);
        $('#'+event.data.message + ' button').click();
      }
/*
      else
      {
        alert('Origin not allowed!');
      }
*/
    }, false);

})(jQuery); // End of use strict

