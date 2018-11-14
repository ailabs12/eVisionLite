exports.src = {
    action: {
        func: function(self) {
            self.bus.request('ivrData', {}, function(err, data) {
                self.session.user = data;
                var offset = 0;
                var todayDate = new Date();
                todayDate.setHours(todayDate.getHours() + offset);
                
                var hour = todayDate.getHours();
                function getGreeting(hour) {
                    if (hour > 24) hour = hour - 24;
                    if (hour >= (self.session.user.params['voice.nightHour']   || 0)   && hour < (self.session.user.params['voice.morningHour'] || 6)) return self.session.user.params['voice.nightGreeting'] || "Доброй ночи";
                    if (hour >= (self.session.user.params['voice.morningHour'] || 6)   && hour < (self.session.user.params['voice.dayHour'] || 11)) return self.session.user.params['voice.morningGreeting'] || "Доброе утро";
                    if (hour >= (self.session.user.params['voice.dayHour']     || 11)  && hour < (self.session.user.params['voice.eveningHour'] || 17)) return self.session.user.params['voice.dayGreeting'] || "Доброе день";
                    if (hour >= (self.session.user.params['voice.eveningHour'] || 17)) return self.session.user.params['voice.eveningGreeting'] || "Добрый вечер";
                }

                self.session.user.greeting = getGreeting(hour) + '. ' + (self.session.user.params['voice.ivrQuestion'] || 'Скажите с кем вас соединить?');
                self.cb();
            })
        },
        next: {
            goto: "старт"
        }
    },
    mediaStream: true,
    mark: {
        0: {
            mark: 'старт',
            ttsPlay: {
                voice: 'alyss',
                text: function(self){return self.session.user.greeting},//'Добрый день. Скажите с кем вас соединить?'
                next: {
                    wait: {time: 10, next: { goto: function(self) {
                            return !self.session.user.target ? 'положить_трубку' : 'null'
                          }
                       }
                    },
                    mark: "Главное меню",
                    on: {
                        'opt': {
                            model: 'general',
                            textFilter: function(self){return self.session.user.filter}
                        },
                        'def': {
                            dtmfData: {
                                next: {
                                    ttsPlay: {
                                        voice: 'alyss',
                                        text: function(self) {
					    var keys = self.session.dtmfData[0].keys;	
                                            var title = '';
                                            self.session.user.data.forEach(function(item){
						if (new RegExp(item[0]).test(keys)) {
							self.session.user.target = item[1];
							title = item[2];
						}
					     });
                                            //console.log(keys, title);

                                            return (self.session.user.params['voice.ivrAnswer'] || 'Вызов будет переведен в') + ' ' + title
                                            //return 'Вызов будет переведен в' + ' ' + title
                                        },
                                        next: {
                                            goto: "звонок"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        1: {
            mark: "звонок",
            play: {
                file: 'media/moh.wav'
            },
            startScript: {
                to: function(self) {
                    console.log(self.session.user.target);
                    return self.session.user.target
                },
                script: 'outgoing.js',
                sipAccountID: '2',
                params: function(self) {
                    return [self.sessionID]
                },
                next: {
                    goto: function(self) {
                        return self.requestRes.event == 'answered' ? 'вызов' : 'абонент_не_найден'
                    }
                }
            }
        },
        2: {
            mark: 'абонент_не_найден',
            ttsPlay: {
                voice: 'alyss',
                text: function(self){return (self.session.user.params['voice.ivrNotAvailable'] || 'К сожалению, абонент не доступен')},
                //text: 'К сожалению, абонент не доступен',
                next: {
                    hangUp: true
                }
            }
        },
        3: {
            mark: 'вызов',
            play: {
                audioBuffer: function(self) {
                    var _endCall = function(data) {
                        //console.log(data.sessionID, self.session.sessionID, self.requestRes.sessionID)
                        var sip = require('mars/lib/sip/sip');
                        if (data.sessionID == self.requestRes.sessionID) {
                            sip.bye(self.session.sessionID)
                        }
                        if (data.sessionID == self.session.sessionID) {
                            sip.bye(self.requestRes.sessionID)
                        }
                        self.bus.removeListener('callEnded', _endCall);
                    }
                    self.bus.on("callEnded", _endCall);
                    return self.requestRes.sessionID
                },
                streaming: true
            }
        },
        4: {
            mark: 'положить_трубку',
            ttsPlay: {
                voice: 'alyss',
                text: function(self){return (self.session.user.params['voice.ivrNotAnswer'] || 'К сожалению, мы не получили от Вас ответа')},
                //text: 'К сожалению, мы не получили от Вас ответа',
                next: {
                    hangUp: true
                }
            }
        }
    }
}