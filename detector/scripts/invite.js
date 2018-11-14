exports.src = {
    goto: function(self) {
        var offset = 0;
        var todayDate = new Date();
        todayDate.setHours(todayDate.getHours() + offset);

        var hour = todayDate.getHours();
        var day = todayDate.getDay();

        self.session.user = {
            hour: hour
        };
	return 'greeting'
    },
    mark: {
        0: {
            mark: "greeting",
            ttsPlay: {
                voice: 'alyss',//alyss //omazh
                text: function(self) {

                    function getGreeting(hour) {
                        if (hour > 24) hour = hour - 24;
                        if (hour >= (self.session.params['voice.nightHour']   || 0)   && hour < (self.session.params['voice.morningHour'] || 6)) return self.session.params['voice.nightGreeting'] || "Доброй ночи";
                        if (hour >= (self.session.params['voice.morningHour'] || 6)   && hour < (self.session.params['voice.dayHour'] || 11)) return self.session.params['voice.morningGreeting'] || "Доброе утро";
                        if (hour >= (self.session.params['voice.dayHour']     || 11)  && hour < (self.session.params['voice.eveningHour'] || 17)) return self.session.params['voice.dayGreeting'] || "Доброе день";
                        if (hour >= (self.session.params['voice.eveningHour'] || 17)) return self.session.params['voice.eveningGreeting'] || "Добрый вечер";
                    }

                    console.log(self.session.params); 
                    var name = self.session.params && self.session.params.name || '';

                    self.session.data = self.session.params.id;
                    if (name == '*') name = '. ' + (self.session.params['voice.unknownMessage'] || '')//'Для связи с оператором нажмите кнопку вызова'

                    var access = '';
                    if (self.session.params.name != '*') {
                    	if (self.session.params.access=='true' || self.session.params.access=='1') 
                     		access = '. ' + (self.session.params['voice.accessMessage'] || ''); //'Входите';
                        else
                            access = '. ' + (self.session.params['voice.accessDeniedMessage'] || '')//'Пожалуйста, свяжитесь с оператором';
                    }

                    return getGreeting(self.session.user.hour) + ' ' + name + access;

                },
                next: {
                    goto: function(self) {
                        return 'hangup' //'openDoor'  
                    }
                }
            }

        },
        1: {
            mark: "hangup",
            wait: {
                time: 1,
                next: {
                    hangUp: true
                }
            }
        }
    }
}