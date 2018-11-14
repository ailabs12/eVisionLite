// Call the dataTables jQuery plugin
$(document).ready(function() {
    //$('#dataTable').DataTable();
    /*
        window.imgFormat = function(img) {
            return "<img class='img-face' src='" + (img[0]=='/' ? "data:image/jpeg;base64," + img: 'images/user.png') +"'</img>";
        };
    */

    var modes = {
        'свободный проход': 2,
        'норма': 0
    };


    window.dateFormat = function(value, row, index) {
        if (!value) return '';
        var offset = new Date().getTimezoneOffset() * 60000;

        var date = new Date(Number(value) - offset);
        if (date instanceof Date && !isNaN(date.valueOf()))
            return date.toISOString().replace(/[TZ]/g, ' ').trim().slice(0, -4)
    };

    window.statusFormat = function(id, row) {
        return row.status ? '<span class="btn btn-sm btn-success" title="Активный"><i class="glyphicon glyphicon-ok"></span>' :
            '<span class="btn btn-sm btn-danger" title="Неактивный"><i class="glyphicon glyphicon-remove"></span>'
    };

    window.daysFormat = function(value, row, index) {
        var days = 'Вс,Пн,Вт,Ср,Чт,Пт,Сб'.split(',');

        days.forEach(function(key, index) {
            if (row['day_' + index] == 'on')
                days[index] = '<b>' + days[index] + '</b>'
        })
        days.push(days.shift());
        return days.join(' ')
    };

    window.modeFormat = function(value, row, index) {
        for (var key in modes)
            if (value == modes[key]) return key
        return value;
    };

    window.tableActions = function(value, row, index) {
        return '<div class="btn-group">' +
            '<button class="btn btn-sm btn-info editRec" title="Редактировать" data-id="' + row.id + '"><i class="glyphicon glyphicon-pencil"></i></button>' +
            '<button class="btn btn-sm btn-danger removeRec" title="Удалить" data-id="' + row.id + '"><i class="glyphicon glyphicon-trash"></i></button>' +
            '</div>';
    }

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

    $('#rulesTbl').bootstrapTable();
    $('#rulesTbl th').resizable({
        resize: function(event, ui) {
            $(this).css('height', '');
        }
    });

    $('#rulesTbl').on('post-body.bs.table', function(e, data) {
        //console.log('Success', data);
        //console.log('Success', rules);
    });

    $('#rulesTbl').on('load-error.bs.table', function(e, status) {
        //console.log('Error', e, status);
    });

    $('#rulesTbl').on('post-body.bs.table', function(e, data) {

        $('.removeRec').click(function(e) {
            console.log('remove', $(this).attr('data-id'));
            $("#removeModal")
                .attr('data-id', $(this).attr('data-id'))
                .modal('show');
        });

        $('.editRec').click(function(e) {
            console.log('edit', $(this).attr('data-id'));
            var id = $(this).attr('data-id');
            var rec;
            var rules = $('#rulesTbl').bootstrapTable('getData', false);
            //console.log(rules);

            rules.some(function(item) {
                if (item.id == id) {
                    rec = item;
                    return true
                };
                return false;
            });

            //if (rec.sendDate) 
            //	return console.log('rule sended');

            $("#editRecordForm").trigger("reset");

            console.log(rec)

            $('[name="id"]', "#editRecordForm").val(id);
            $('[name="adtFrom"]', "#editRecordForm").val(rec.adtFrom);
            $('[name="adtTo"]', "#editRecordForm").val(rec.adtTo);
            $('[name="mode"]', "#editRecordForm").val(rec.mode);
            $('[name="status"]', "#editRecordForm").prop('checked', rec.status == 'on');

            [0, 1, 2, 3, 4, 5, 6].forEach(function(index) {
                $('[name="day_' + index + '"]', "#editRecordForm").prop('checked', rec['day_' + index] == 'on');
            });

            $("#editRecordModal").modal('show');
            //setTimeout(function(){$('[name="to"]', "#editRecordForm").val(rec.to).change()},500);
        });

        $('.addRec').click(function(e) {
            $("#editRecordForm").trigger("reset");
            var offset = new Date().getTimezoneOffset() * 60000;

            var now = new Date(new Date().getTime() - offset);

            //new Date().getTimezoneOffset() * 60000

            var deltaNow = new Date();
            deltaNow.setHours(deltaNow.getHours() + 1);
            deltaNow = new Date(deltaNow.getTime() - offset);

            $('[name="id"]', "#editRecordForm").val('');
            $('[name="adtFrom"]', "#editRecordForm").val(now.toISOString().trim().slice(11, -8));
            $('[name="adtTo"]', "#editRecordForm").val(deltaNow.toISOString().trim().slice(11, -8));
            $("#editRecordModal").modal('show');
        })

        $('[title]').tooltip()

    });

    function refreshModes() {
        var modesSelect = $('select[name="mode"]');
        var names = [];
        for (var name in modes)
            names.push(name);

        names.forEach(function(name) {
            modesSelect.append('<option value=' + modes[name] + '>' + name + '</option>');
        });

        modesSelect.change();
    }

    function addHoliday(date){
      var holidaysDiv = $('#holidays');
          holidaysDiv.append(
              '<div class="form-inline">' +
              '    <div class="datetimepicker input-group date">' +
              '        <input type="text" class="form-control form-control-sm holiday" data-id="' + date.id + '" value="' + date.day + '"/>' +
              '        <span class="btn btn-sm btn-success input-group-addon" title="Изменить дату">' +
              '           <span class="glyphicon glyphicon-calendar"></span>' +
              '         </span>' +
              '        <span class="btn btn-sm btn-danger input-group-addon removeHolidayBtn" data-id="' + date.id + '" title="Удалить дату">' +
              '           <span class="glyphicon glyphicon-trash"></span>' +
              '         </span>' +
              '    </div>' + 
              '</div>'

          );
    }
    function saveHoliday(data){
       $.ajax({
           type: data.id ? "PUT" : "POST",
           url: "/api/scud/holidays" + (data.id ? '/' + data.id : ''),
           data: data,
           success: function(res) {
               refreshHolidays(function(){
                    if (!data.id)
             	      $('span.btn.btn-sm.btn-success.input-group-addon',$('.holiday[data-id="' + res.id + '"]').parent()).trigger("click")
	       })
               console.log(data, res);
           }
       });
    }

    function updateHolidayHandlers(){
                $('.date')
                    .datetimepicker({
                        locale: 'ru',
			//pickerPosition: 'top-right',
			//orientation: "top right",
			//numberOfMonths: 2,
                        //defaultDate: new Date(),
                        //format: 'YYYY-MM-DD'
                        format: 'DD.MM'
                    })
                    .on('dp.change', function(e) {
                        var input = e.target.firstElementChild

                        var data = {
                            id: $(input).attr('data-id'),
                            day: $(input).val()
                        }
                        saveHoliday(data)
                    })
		   .removeClass('date');

                $('.removeHolidayBtn').click(function(event) {
                    $.ajax({
                        type: "DELETE",
                        url: "/api/scud/holidays/" + $(this).attr('data-id'),
                        success: function(text) {
                            setTimeout(refreshHolidays, 0)
                            console.log(text);
                        }
                    });
                }).removeClass('removeHolidayBtn');
       }

    function refreshHolidays(cb) {
        $.ajax({
            type: "GET",
            url: "/api/scud/holidays",
            success: function(data) {
                var holidaysDiv = $('#holidays');
                holidaysDiv.empty();
                data.forEach(function(date) {
			addHoliday(date)
                })
                updateHolidayHandlers()
                if (cb) cb()
                $('[title]').tooltip()
                //console.log(data)
            }
        });

    }

        $('.addHoliday').click(function(e) {
             var now = new Date()
             var data = {id:'', day: new Date().toISOString().slice(5, 10).split('-').reverse().join('.')}
             addHoliday(data);
             //updateHolidayHandlers();
	     saveHoliday(data);	
	     //$('span.btn.btn-sm.btn-success.input-group-addon',$('.holiday[data-id=""]').parent()).trigger("click")
	     $('[title]').tooltip()
        });

    refreshModes()
    refreshHolidays()
    $("#editRecordForm").trigger("reset");

    $('#rulesTbl').bootstrapTable('refresh', {
        url: '/api/scud/rules'
    });
});