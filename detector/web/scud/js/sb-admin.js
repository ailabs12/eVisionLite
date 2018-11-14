(function($) {
    "use strict"; // Start of use strict
    // Configure tooltips globally

    $('[title]').tooltip()
    // Smooth scrolling using jQuery easing

    function dateStrToTimestamp(dateStr) {
        var offset = new Date().getTimezoneOffset() * 60000;
        var dateMatch = dateStr.split(' ');
        return new Date(dateMatch[0] + 'T' + dateMatch[1] + '.000Z').getTime() + offset;
    }

    $('#editRecordForm').on('submit', function(event) {
        // cancels the form submission
        event.preventDefault();

        if (this.checkValidity() == false) {
            return false;
        }

        var data = {};

        $(this)
            .serializeArray()
            .forEach(function(item) {
                data[item.name] = item.value
            });

        //console.log(data);
        data.createDate = new Date().getTime();

        console.log(data);

        $.ajax({
            type: data.id ? "PUT" : "POST",
            url: "/api/scud/rules" + (data.id ? '/' + data.id : ''),
            data: data,
            success: function(text) {
                //console.log(text)
                $('#rulesTbl').bootstrapTable('refresh');
                $("#editRecordModal").modal('hide');
            }
        });
    })

    $(document).on('click', '.removeBtn', function(event) {
        $.ajax({
            type: "DELETE",
            url: "/api/scud/rules/" + $("#removeModal").attr('data-id'),
            success: function(text) {
                $("#removeModal").modal('hide');
                $('#rulesTbl').bootstrapTable('refresh');
                //console.log(text)
            }
        });
    });

    $(document).on('click', '.form-submit', function(event) {
        $("#editRecordForm").submit();
    });


    $(document).on('click', '#modeRefreshBtn', function(){

    })

    $('select[name="to"]').change(function(){
	//console.log($(this).attr('_value'), $(this).val()); 
        if ($(this).attr('_value')){
	   //$(this).val($(this).attr('_value'));
	   //$(this).attr('_value',"")
	};
    })

    $("#editRecordModal").on('shown.bs.modal', function(event){

    })

    $('.time').datetimepicker({
        locale: 'ru',
	format: "HH:mm"
    });


})(jQuery); // End of use strict