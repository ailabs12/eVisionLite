var videos = [];
$(() => {

  var closestIndex = 0;
  var $vid = $('#video1');
  var $handle = $('#handle1');
  var updateHandleInterval;

  $(document).ready(() => {
		$.when(refreshDataAndInterface()).then(() => {
			setInterval(refreshDataAndInterface, 300000);

			$handle.text(pad(videos[videos.length - 2].date.getHours()) +
				':' + pad(videos[videos.length - 2].date.getMinutes())  +
  			':' + pad(videos[videos.length - 2].date.getSeconds()));
			$('#slider1').slider('value', timeToValue(videos[videos.length - 2].date));

			$vid.find('source').attr('src', videos[videos.length - 2].url);
			$vid.get(0).load();
      $vid.get(0).pause();
		});
  });

  $('#video1').on('playing', () => {
    updateHandleInterval = setInterval(function() {
      updateHandle();
    }, 1000);
  }).on('pause', () => {
    clearInterval(updateHandleInterval);
  }).on('seeking', () => {
    updateHandleOnSeeking($vid.get(0).currentTime);
  }).on('ended', () => {
    clearInterval(updateHandleInterval);
    if (closestIndex < videos.length) closestIndex++;

    let value = this.timeToValue(videos[closestIndex].date);
    let time = valueToTime(value);

    $('#slider1').slider('value', value);
    $handle.text(time.hour + ':' + time.minute + ':' + time.second);

		$('#datepicker1').datepicker('setDate', videos[closestIndex].date);

		setMaxMix(videos[closestIndex].date);

    $vid.find('source').attr('src', videos[closestIndex].url);
    $vid.get(0).load();
    $vid.get(0).pause();
  });

  $('#slider1').slider({
    range: 'max',
    min: 0,
    max: 86399,
    step: 1,
    values: 0,
    slide: (e, ui) => {
      clearInterval(updateHandleInterval);
      let time = valueToTime(ui.value);
      let date = $('#datepicker1').datepicker('getDate');
      let combined = combineDateAndTime(date, time.hour, time.minute, time.second);
      closestIndex = getIndexOfClosestDate(combined, videos);
      let closest = videos[closestIndex].date;
      let difference = combined - closest;
      let src = videos[closestIndex].url;

      $vid.find('source').attr('src', src);
      $vid.get(0).load();
      if (difference > -600000 && difference < 600000)
        $vid.get(0).currentTime = Math.round(difference / 1000);
      $vid.get(0).pause();

      $handle.text(time.hour + ':' + time.minute + ':' + time.second);
    },
  });

  $('#refresh_video1').click(() => {
    refreshDataAndInterface();
  });

  updateHandle = function() {
    let date = new Date();
    let time = strToTime($handle.html());
    date = combineDateAndTime(date, time.hour, time.minute, time.second);
    date.setSeconds(date.getSeconds() + 1);
    let value = timeToValue(date);
    time = valueToTime(value);

    $handle.text(time.hour + ':' + time.minute + ':' + time.second);
    $('#slider1').slider('value', value);
  }

  updateHandleOnSeeking = function(added) {
    let date = new Date();
    let time = strToTime($handle.html());
    date = combineDateAndTime(date, time.hour, time.minute, time.second);
    let difference = Math.round((date - videos[closestIndex].date)/ 1000);
    if (added > difference)
      date.setSeconds(date.getSeconds() + Math.round(added - difference));
    else date.setSeconds(date.getSeconds() - Math.round(difference - added));
    let value = timeToValue(date);
    time = valueToTime(value);

    $handle.text(time.hour + ':' + time.minute + ':' + time.second);
    $('#slider1').slider('value', value);
  }


  refreshDataAndInterface = function() {
		return new Promise(resolve => {
			$.when(parseData()).then((vids) => {
        if (vids) {
          videos = vids;
          setMaxMix();
          $('#datepicker1').datepicker({
            changeMonth: true,
            changeYear: true,
            showAnim: 'slideDown',
            dateFormat: "yy-mm-dd",
            defaultDate: videos[videos.length - 2].date,
            minDate: videos[0].date,
            maxDate: videos[videos.length - 2].date,
            onSelect: (date) => {
              let time = valueToTime($('#slider1').slider('value'));
              let combined = combineDateAndTime(date, time.hour, time.minute, time.second);
              closestIndex = getIndexOfClosestDate(combined, videos);
              let closest = videos[closestIndex].date;
              let difference = combined - closest;
              let src = videos[closestIndex].url;

              setMaxMix(combined);

              $vid.find('source').attr('src', src);
              $vid.get(0).load();
              if (difference > -600000 && difference < 600000)
                $vid.get(0).currentTime = Math.round(difference / 1000);
              $vid.get(0).pause();
            },
          });
          $('#datepicker1').datepicker('setDate', videos[videos.length - 2].date);
          resolve();
        }
        else {
          $('#datepicker1').datepicker({
            changeMonth: true,
            changeYear: true,
            showAnim: 'slideDown',
            dateFormat: "yy-mm-dd",
            defaultDate: new Date(),
            minDate: new Date(),
            maxDate: new Date(),
          });

          $('#datepicker1').datepicker('setDate', new Date());

          $('#slider1').hide();
          $('#video1').hide();
        }
      });

    });
  }

  valueToTime = function(value) {
    let time = new Date(value * 1000).toISOString().substr(11, 8);

    return {
      hour: time.substr(0, 2),
      minute: time.substr(3, 2),
      second: time.substr(6, 2)
    };
  };

  strToTime = function(str) {
    return {
      hour: str.substr(0, 2),
      minute: str.substr(3, 2),
      second: str.substr(6, 2)
    };
  };

  timeToValue = function(date) {
    return date.getSeconds() + (60 * date.getMinutes()) + (60 * 60 * date.getHours());
  };

  combineDateAndTime = function(date, hour, minute, second) {
    if (typeof date.getMonth === 'function') {
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();
      date = '' + year + '-' + month + '-' + day;
    }

    return new Date(date + ' ' + hour + ':' + minute + ':' + second);
  };

  getIndexOfClosestDate = function(combined, videos) {
    let closest = new Date();
    let closestID = 0;
    let difference = 0;
    for (let i = 0; i < videos.length; i++) {
      if (videos[i].date >= combined && videos[i].date < closest) {
        closest = videos[i].date;
        closestID = i;
      }
    }
    difference = combined - closest;
    if (difference > -600000 && difference < 600000) {
      if (closestID <= 0) return 0
      else return closestID - 1;
    } else if (difference <= -600000) return 0;
    else if (difference >= 600000) return videos.length - 2;
  };

  function parseData() {
    return new Promise(resolve => {
      $.getJSON('/api/videos', data => {
        if (data.length <= 1) resolve(null);
        else {
          $.each(data, (index, value) => {
            let name = value;
            let date = new Date(
              value.slice(0, -15),
              value.slice(4, -13) - 1,
              value.slice(6, -11),
              value.slice(9, -8),
              value.slice(11, -6),
              value.slice(13, -4)
            );
            var url = document.location.origin + '/videos/' + value;
            videos.push({
              name: name,
              url: url,
              date: date
            });
          });
        }
        resolve(videos);
      });
    });
  }

  function setMaxMix(combined) {
    let minValue = timeToValue(videos[0].date);
    let maxValue = timeToValue(videos[videos.length - 2].date);
    let timeValue;

    if (videos[0].date.getDate() == videos[videos.length - 2].date.getDate()) {
      $('#slider1').slider('option', 'min', minValue);
      $('#slider1').slider('option', 'max', maxValue);
      return;
    } else {
      if (combined)
        timeValue = timeToValue(combined);
      else
        combined = videos[videos.length - 2].date;
    }

    if (combined.getDate() == videos[0].date.getDate()) {
      $('#slider1').slider('option', 'min', minValue);
      $('#slider1').slider('option', 'max', 86399);
      if (timeValue < minValue) {
        $handle.text(pad(videos[0].date.getHours()) +
          ':' + pad(videos[0].date.getMinutes()) +
          ':' + pad(videos[0].date.getSeconds()));
        $('#slider1').slider('value', minValue);
      }
    } else if (combined.getDate() == videos[videos.length - 2].date.getDate()) {
      $('#slider1').slider('option', 'min', 0);
      $('#slider1').slider('option', 'max', maxValue);
      if (timeValue > maxValue) {
        $handle.text(pad(videos[videos.length - 2].date.getHours()) +
          ':' + pad(videos[videos.length - 2].date.getMinutes()) +
          ':' + pad(videos[videos.length - 2].date.getSeconds()));
        $('#slider1').slider('value', maxValue);
      }
    } else {
      $('#slider1').slider('option', 'min', 0);
      $('#slider1').slider('option', 'max', 86399);
    }
  }

  function pad(n) {
    return ('0' + n).slice(-2);
  }

  $('#historyTbl').on('click-cell.bs.table', (field, value, row, $e) => {
    if (value == 'date') {
      let clicked = new Date($e.date);
      closestIndex = getIndexOfClosestDate(new Date(row), videos);

      let closest = videos[closestIndex].date;
      let difference = clicked - closest;
      let src = videos[closestIndex].url;

      if (difference > -600000 && difference < 600000) {
        $('.nav-tabs a[href="#videoArchive"]').tab('show');
        $('#datepicker1').datepicker('setDate', closest);
        setMaxMix(closest);
        $vid.find('source').attr('src', src);
        $vid.get(0).load();
        $vid.get(0).currentTime = Math.round(difference / 1000 - 5);
        $vid.get(0).pause();
        let value = timeToValue(clicked);
        let time = valueToTime(value);

        $('#slider1').slider('value', value);
        $handle.text(time.hour + ':' + time.minute + ':' + time.second);
      }
    }
  });
	

  $('#historyTbl').on('refresh.bs.table', (params) => {
	$.when(parseData()).then((vids) => {
		if (vids) videos = vids;
	});
  });
  

  $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
      window.activeTab = $(e.target).attr('aria-controls');

      if (window.activeTab != 'videoArchive') {
        $vid.get(0).pause();
      }
  });
});

function wrapFormatter (value, row, index, param) {
  let time = new Date(value);
  closestIndex = getIndexOfClosestDate(new Date(value), videos);
  let closest = videos[closestIndex] && videos[closestIndex].date;
  let difference = time - closest;
  if (difference > -600000 && difference < 600000) {
    return '<a href="#videoArchive" style="text-decoration: none" title="' + ((param.prefix) ? param.prefix : '') + ((param.text) ? param.text : ((param.column) ? row[param.column] : value)) + ((param.suffix) ? param.suffix : '') + '">' + value + '</a>';
  } else return value;
}

function wrapFormatter_date (value, row, index) {
  return wrapFormatter (value, row, index, {
    text: 'Просмотреть видеофрагмент'
  });
}
