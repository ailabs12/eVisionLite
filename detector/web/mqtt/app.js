  var client = mqtt.connect('ws://iot.eclipse.org/ws') // you add a ws:// url here
  client.subscribe("6ccebe16-a401-4355-9632-48f9d6dec339/door")

  client.on("message", function (topic, payload) {
    //console.log([topic, payload].join(": "))
    var name,
	id = payload.toString();
    for (var user in users)
      if (users[user].split(',').indexOf(id) != -1){
        name = user;
        break; 
       }
     if (!name) return;

     $("#msg").html(playing + ' ' + (new Date()).toISOString().replace(/[TZ]/g, ' ') + name);
     /*
     $.ajax({
         url: getUserMessages + id,
         success: function(data) {
             console.log(getUserMessages + id, data);
             if (data && data.length)
		setTimeout(function(){	
		 yandexSpeak(data.map(function(item){return item.message}).join(' '))
		}, 4000);
         }
     });
     */
     //return;
	var prefix = 'Зашел';
	if (['а','я'].indexOf(name.split(' ')[0].slice(-1)) != -1) 
	  prefix = 'Зашла';
	yandexSpeak(prefix + ' ' + name)
  })

    var getUsersUrl = 'http://172.17.3.206/api/users?password=admin';
    var getUserMessages = 'http://172.17.3.206:3002/message?to_like='
    var users = {};
    var playing = false;

     $.ajax({
         url: getUsersUrl,
         success: function(data) {
             if (data && data.forEach)
		data.forEach(function(item){users[item.name] = users[item.name] ? (users[item.name] + ',' + item.id): item.id});
	   //console.log(users);
         }
     });
 
var audio = new Audio();
    audio.autoplay = true;
    audio.addEventListener("loadeddata", function() {
        console.log('source loaded...');
        $("#msg").html($("#msg").html() + '<br>' + 'sound loaded...');
 	audio.play(); 
     }, true);

function yandexSpeak(text, cb) {
    if (playing) return console.log('Already playing ...')
    playing=true; 

    function onEnded(){
        $("#msg").html($("#msg").html() + '<br>' + 'sound ended...');
         console.log("ended");
      if (cb) cb();
      playing=false;
      audio.removeEventListener("ended", onEnded)
    }
    audio.addEventListener("ended", onEnded);	
    audio.src = 'https://tts.voicetech.yandex.net/tts?speaker=omazh&text='+text+'&_='+new Date().getTime();
}

