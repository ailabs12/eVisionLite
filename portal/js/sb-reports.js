(function($) {
    var params = {};
    var host = window.document.location.protocol + '//' + window.document.location.host.replace(/:.*/, '');
    location.search.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(s, k, v) {
        if (!(/^cam\d/.test(k))) return;
        params[k] = v
    })

    //console.log(params[Object.keys(params)[0]]);
    var users = {};

    window.sourceFormat = function(value, row) {
        return value; // + ('image_type' in row && 'image_score' in row ? '<br>' + row.image_type + '<br>' + row.image_score : '')
    };

    window.imgFormatF = function(id, row) {
        var _url = host + ':' + row.sourcePort;
        return "<img class='img-face' src='" + _url + "/images/" + row.date.replace(/\D/g, '').substring(0, 8) + "/" + id + ".full.jpeg' onerror='this.src=\"images/image_not_found.png\"'</img>";
    };

    window.imgFormatH = function(id, row) {
        var _url = host + ':' + row.sourcePort;
        var img_class = 'img-face';
	if (row.image_type == '5')
	    img_class = 'img-hplate';
        return "<img class='" + img_class + "' src='" + _url + "/images/" + row.date.replace(/\D/g, '').substring(0, 8) + "/" + id + ".jpeg'</img>";
    };

    window.imgFormatType = function(id, row) {
       return row.image_type == '5' ? 'а/м номер':'лицо'; 
    }
    window.imgFormatO = function(id, row) {
        var _url = host + ':' + row.sourcePort;
        var _name = row.id.split('|');
        if (_name[1]) return "<img class='img-face' src='images/user.png'</img>";
        if (window.params && window.params.viewUnknown) return "<img class='img-face' src='" + _url + "/persons/" + id + ".jpeg' onerror='this.src=\"images/image_not_found.png\"'</img>";
        return "<img class='img-face' src='" + (((row.accuracy || '').split(';')[1] || row.event_trust) == '1' ? _url + "/persons/" + id + ".jpeg" : "images/user.png") + "' onerror='this.src=\"images/image_not_found.png\"'</img>";
        //return "<img class='img-face' src='" + (row.accuracy > row.minAccuracy ? "/persons/" + id + ".jpeg" : "images/user.png") + "'</img>";
    };

    window.nameFormat = function(id, row) {
	if (row.image_type == '5') return id;
        var _name = row.id.split('|');
        if (_name[1]) return _name[1]; 
        return ((row.accuracy || '').split(';')[1] || row.event_trust) == '1' ? users[id] : "*";
    };

    window.procFormat = function(value) {
        return (value * 100).toFixed(2) + '%';
    };

    window.accFormat = function(values, row) {
        var _name = row.id.split('|');
        if (_name[1]) return ''; 
        return ((values || '').split(';')[0] * 100).toFixed(2) + '%';
    };

    window.procFormat = function(values) {
        return values
            .split(';')
            .slice(0, 1)
            .map(function(value) {
                return (value * 100).toFixed(2) + '%';
            }).join('<br>');
    };

    window.histRowStyle = function(row, index) {
        //console.log(row.accuracy.split(';')[1]);	
        var events = (row.accuracy || '').split(';');
        if (events[1] == '1' || row.event_trust == '1')
            return {
                classes: "table-success text-primary" + ((events[2] == "1" || row.event_send == '1') ? " row-border-success" : "") //font-weight-bold 
            };
        if (events[2] == '1' || row.event_send == '1')
            return {
                classes: "row-border-danger" //font-weight-bold 
            };
        return {};
    }
    window.userRowStyle = function(row, index) {
        //console.log(row.id);
        if (row.id.split('').slice(-1) == '_') return {
            classes: "table-info"
        }
        return {};
    }
    window.idFormat = function(value, row) {
        //return value.split("").map(function(l,i){if ((i+1) % 4 == 0) l +=' '; return l;}).join('');

        var len = Object.keys(users).length;
        var index = 0;
        for (var k in users) {
            if (row.id == k) break;
            index++;
        }
        return len - index;
    };

    window.descriptorFormat = function(value, row, index) {
        return '<button class="btn btn-sm btn-danger removeRec" title="Удалить фото" data-id="' + row.id + '"><i class="glyphicon glyphicon-trash"></i></button>'
    };

    window.descriptorLogFormat = function(value, row, index) {
        return '<a class="btn btn-success btn-sm addRec" data-id="' + row.image + '"><span class="glyphicon glyphicon-plus" title="Добавить пользователя"></span></a></div>';
    };

    var filters = {event_send: '1'};
    window.queryParams = function() {
        var params = {};
        $('#toolbar').find('input[name]').each(function() {
            params[$(this).attr('name')] = $(this).val();
        });
        return params;
    }

    $(".datepicker").datepicker({
        changeMonth: true,
        changeYear: true,
        firstDay: 1,
        showAnim: 'slideDown',
        dateFormat: 'yy-mm-dd',
        onSelect: (date) => {
            $('#reportsTbl').bootstrapTable('refresh');
        }
    });

    $(".datepicker").datepicker("setDate", new Date());
    
    $('#toolbar').find('select[name="objectType"]').change(function() {
        var type = $(this).val();
        console.log(type);
         
        if (type==0) delete filters.image_type;

        if (type==1)
            filters.image_type = ['','0','1','2','3','4']

        if (type==2)
            filters.image_type = '5'

        $('#reportsTbl').bootstrapTable('filterBy', filters);
    })
    
    /*
    $('#reportsTbl').on('load-success.bs.table', function(data) {
        //console.log(data);
        //users = {};
        $('#reportsTbl')
            .bootstrapTable('getData', false)
            .forEach(function(item, index) {
                console.log(item);
                //users[item.id] = 
		item.name
            });
        //console.log(Object.keys(users).length)
    });
    */
    $('#reportsTbl').bootstrapTable({
        exportDataType: 'all',
        onRefresh: function(){refersh(true)}
    });
    function refersh(removeAll) {
        var table = $('#reportsTbl');
        if (removeAll) table.bootstrapTable("removeAll");
        Object.keys(params).forEach(function(k) {
            var _url = host + ':' + params[k];
            $.ajax({
                type: 'GET',
                url: _url + '/api/users',
                /*success*/complete: function(data,status) {
                    if (status == "success"){
                    //console.log(data,status)
                       (data && data.responseJSON || []).forEach(function(item, index) {
                           users[item.id] = item.name
                       });
                    }
                    $.ajax({
                        type: 'GET',
                        data: window.queryParams(),
                        url: _url + '/api/logs',
                        success: function(data) {
                            data = data.map(function(item) {
                                item.sourcePort = params[k];
                                return item
                            })
                            table.bootstrapTable('append', data)
                        }
                    })

                },
	        error: function(){
	           //console.log('Not faces!!!');
	        }
            })
            $('#reportsTbl').bootstrapTable('filterBy', filters).show();

        })
    }
    refersh();
})(jQuery); // End of use strict