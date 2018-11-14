// Call the dataTables jQuery plugin
$(document).ready(function() {
    var users = {};
    var plates = {};

    window.sourceFormat = function(value, row) {
        return value; // + ('image_type' in row && 'image_score' in row ? '<br>' + row.image_type + '<br>' + row.image_score : '')
    };

    window.imgFormatF = function(id, row) {
        var img_class = 'img-face';
	if (window.objectType == '1')
	    img_class = 'img-hplate';
        return "<img class='" + img_class + "' src='/images/" + row.date.replace(/\D/g, '').substring(0, 8) + "/" + id + ".full.jpeg' onerror='this.src=\"images/image_not_found.png\"'</img>";
    };

    window.imgFormatH = function(id, row) {
        var img_class = 'img-face';
	if (window.objectType == '1')
	    img_class = 'img-hplate';
            return "<img class='" + img_class + "' src='/images/" + row.date.replace(/\D/g, '').substring(0, 8) + "/" + id + ".jpeg'</img>";
    };

    window.imgFormatP = function(id, row) {
           return "<img class='img-face' src='/persons/" + id + ".jpeg' onerror='this.src=\"images/image_not_found.png\"'</img>";
    };

    window.imgFormatPl = function(id, row) {
        var plate = row.name || row.id;
	return "<img class='img-plate' src='images/plate_def.png'><span class='plate_2'>" + plate.substr(6,8) + "</span><span class='plate_1'>"+ plate.substr(0,6) + "</span>"
    };

    window.accessFormat = function(id, row) {
        return row.access ? '<span class="btn btn-sm btn-success" title="Доступ разрешен"><i class="glyphicon glyphicon-ok"></span>' :
            '<span class="btn btn-sm btn-danger" title="Доступ запрещен"><i class="glyphicon glyphicon-remove"></span>'
        return "<img class='img-face' src='images/" + (row.access ? "check.png" : "delete.png") + "'</img>";
    };

    window.imgFormatO = function(id, row) {
        var _name = row.id.split('|');
        if (_name[1]) return "<img class='img-face' src='images/user.png'</img>";

        if (window.params && window.params.viewUnknown) return "<img class='img-face' src='/persons/" + id + ".jpeg' onerror='this.src=\"images/image_not_found.png\"'</img>";
        return "<img class='img-face' src='" + ((row.accuracy.split(';')[1] || row.event_trust) == '1' ? "/persons/" + id + ".jpeg" : "images/user.png") + "' onerror='this.src=\"images/image_not_found.png\"'</img>";
        //return "<img class='img-face' src='" + (row.accuracy > row.minAccuracy ? "/persons/" + id + ".jpeg" : "images/user.png") + "'</img>";
    };

    window.nameFormat = function(id, row) {
	if (window.objectType == '1') return id;
        var _name = row.id.split('|');
        if (_name[1]) return _name[1]; 
        //return users[id]
        return (row.accuracy.split(';')[1] || row.event_trust) == '1' ? users[id] : "*";
        //return row.accuracy > row.minAccuracy ? users[id] : "*";
    };

    window.procFormat = function(value) {
        return (value * 100).toFixed(2) + '%';
    };

    window.accFormat = function(values,row) {
        var _name = row.id.split('|');
        if (_name[1]) return ''; 
        return (values.split(';')[0] * 100).toFixed(2) + '%';
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
        var events = row.accuracy.split(';');
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
        if (row.id.split('').slice(-1)=='_') return {classes: "table-info"}
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

    window.plateActions = function(value, row, index) {
        return '<button class="btn btn-sm btn-info editRecPlate" title="Редактировать" data-name="' + row.name + '"><i class="glyphicon glyphicon-pencil"></i></button><button class="btn btn-sm btn-danger removeRec" title="Удалить номер" data-id="' + row.id + '"><i class="glyphicon glyphicon-trash"></i></button>'
    };


    window.queryParams = function() {
        var params = {};
        $('#toolbar').find('input[name]').each(function() {
            params[$(this).attr('name')] = $(this).val();
        });
        return params;
    }

    var last;
    window.rowStyle = function rowStyle(row, index) {
        var style = {};
        if (row.name != '*' && last == row.name)
            style = {
                //classes: 'bg-success'//,
                css: {
                    "background-color": "#01bb2c52"
                }
            };
        last = row.name;
        return style
    };


    $('#historyTbl').bootstrapTable({exportDataType: 'all'});
    $('#historyTbl th').resizable({
        resize: function(event, ui) {
            $(this).css('height', '');
        }
    });


    $('#historyTbl').on('post-body.bs.table', function(e, data) {
        $('.addRec').click(function(e) {
            var id = $(this).attr('data-id');
            var rec;

            $('#historyTbl')
                .bootstrapTable('getData', false)
                .some(function(item) {
                    if (item.image == id) {
                        rec = item;
                        return true
                    };
                    return false;
                });

            var image = "/images/" + rec.date.replace(/\D/g, '').substring(0, 8) + "/" + rec.image + ".jpeg";
            console.log(id);
            console.log(image);

            $("#editRecordForm").trigger("reset");
            $('[name="image"]', "#editRecordForm").val(image);
            $("#personImage").attr('src', image);
            $("#editRecordModalLabel").text("Добавление нового пользователя");
            $('[name="action"]', "#editRecordForm").val('insert');
            $("#editRecordModal").modal('show');

        })
        $('[title]').tooltip()
        $('[data-tooltip="true"]').tooltip();
    });

    $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
        window.activeTab = $(e.target).attr('aria-controls');

        if (window.activeTab == 'historyTable') {
            console.log('historyTable');
            $('#historyTbl').bootstrapTable('refresh', {
                url: '/api/logs'
            });
	    if (window.objectType == '1') {
		$('#historyTbl').bootstrapTable('hideColumn','id');	
		$('#historyTbl').bootstrapTable('hideColumn','accuracy');	
		$('#historyTbl').bootstrapTable('hideColumn','descriptor');	
                $('#historyTbl th:nth-child(5) .th-inner').text('Номер');
		//$('#historyTbl').bootstrapTable('exportOptions', {fileName: "report", "csvSeparator":";" ,"ignoreColumn": [2,3]})
            }
        }
    });


    $('#toolbar').find('input[name="event"]').click(function() {
        var params = {};
        if ($(this).prop('checked'))
            params = {
                event_send: '1'
            };

        $('#historyTbl').bootstrapTable('filterBy', params);
    });

});
