var jsonServer = require('json-server');
var bodyParser = require('body-parser');
var router = jsonServer.router('db.json')

function getDateParams() {
    var now = new Date();
    return {
        month: now.getMonth() + 1,
        day: now.getDate(),
        dayOfWeek: now.getDay(), //0 - вс
        hour: now.getHours(),
        minute: now.getMinutes()
    }
}

function getMode() {
    //TEST
    //return String(new Date().getMinutes() % 2 == 0 ? 0 : 2)
    //TEST

    var rules = router.db.get('rules').value() || [];
    var holidays = router.db.get('holidays').value() || [];

    //console.log(rules, holidays)

    var dayParams = getDateParams();

    var inHolidays = false;

    holidays.forEach(function(holiday) {
        var data = holiday.day.split('.');
        var day = data[0];
        var month = data[1];

        if (month == dayParams.month &&
            day == dayParams.day)
            inHolidays = true;
    })

    var mode = 0;

    //console.log('inHolidays', inHolidays)

    if (inHolidays) return mode;

    rules.forEach(function(rule) {
        //console.log('rule.status', rule.status);

        if (rule.status !== 'on') return;

        //console.log('day_' + dayParams.dayOfWeek, rule['day_' + dayParams.dayOfWeek])

        if (rule['day_' + dayParams.dayOfWeek] != 'on') return;

        var adtFrom = Number(rule.adtFrom.replace(':', '.'));
        var adtTo   = Number(rule.adtTo.replace(':', '.'));

        var hour = Number(dayParams.hour + '.' + (dayParams.minute < 9 ? '0' : '') + dayParams.minute)

        //console.log('rule.id', rule.id, 'rule.mode', rule.mode, 'hour', hour, 'adtFrom', adtFrom ,'adtTo', adtTo)

        if (hour >= adtFrom && hour <= adtTo)
            mode = rule.mode
    })

    return mode;
}

module.exports = function(app, params) {
    console.log('SCUD controller stared')

    app.use(bodyParser.json()); // support json encoded bodies
    app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

    //var curMode

    app.post('/api/scud/event', function(req, res, next) {

        if (!req.body || !req.body.messages) return res.json({
            message: '"messages" not found',
            success: false
        })
        //console.log('received', req.body)

        var resMessages = [];

        if (req.body.messages.forEach)
           req.body.messages.forEach(function(message) {
            if (message.operation == 'power_on')
                resMessages.push({
                    id: message.id,
                    operation: "set_active",
                    "active": 1,
                    "online": 0
                })

            if (message.operation == 'events'){
		message.events.forEach(function(event){
		   //console.log(event)
                })
                resMessages.push({
                    id: message.id,
                    operation: "events",
                    "events_success": message.events.length
                  })
               }

            if (message.operation == 'ping') {

            }


            if (message.operation == 'check_access')
                resMessages.push({
                    id: message.id,
                    operation: "check_access",
                    "granted": 1,
                })
           if ('mode' in message){

                var curMode = String(message.mode).split('').slice(-1)[0]; //32(?) -> 2 , 0 -> 0
        	var mode = String(getMode());

                if (curMode != mode) {
                    resMessages.push({
                        id: message.id,
                        operation: "set_mode",
                        "mode": Number(mode)
                    })
                }

           }
        })


          //console.log('curMode', curMode, 'mode', mode)

        var tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds

        var result = {
            date: (new Date(Date.now() - tzoffset)).toISOString().replace('T', ' ').substring(0, 19),
            interval: 10,
            messages: resMessages
        }
        //console.log('sended', result)
        res.json(result);
    });

    app.use('/api/scud', router);
}