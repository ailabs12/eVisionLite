$(() => {
	$(document).ready(() => {
		$.when(getSysInfo()).then(() => {			
			setInterval(getSysInfo, 5000);			
		});
	});

	getSysInfo = function() {
		return new Promise(resolve => {
		  $.getJSON('/api/sysinfo', data => {
			if (data.length == 0) resolve();
			else {
				let cpu = data.currentLoad;

				let averCpu = Math.round(cpu.currentload);
				$('#cpuUsage').html('<b>CPU:</b> ' + averCpu + '%');

				let title = '';
				for (let i = 0; i < cpu.cpus.length; i++) {
					let aver = Math.round(cpu.cpus[i].load);
					title += 'CPU' + pad(i) + ': ' + aver + '%\n';
				}			
				$('#cpuUsage').attr('title', title);
				//$('#cpuUsage').tooltip();

				toggle($('#cpuUsage'), averCpu);

				let mem = data.mem;
				let memUsage = $('#memUsage');
				
				let memUsed = Math.round(((mem.used - mem.buffcache) / mem.total * 100));
				$('#memUsage').html('<b>MEM:</b> ' + memUsed + '%');
				
				title = bytesToSize(mem.used - mem.buffcache) + ' / ' + bytesToSize(mem.total);
				$('#memUsage').attr('title', title);
				//$('#memUsage').tooltip();

				toggle($('#memUsage'), memUsed);

				let fs = data.fsSize;	
				
				let driveUsed = Math.round(fs[0].use);
				$('#driveUsage').html('<b>HDD:</b> ' + driveUsed + '%');

				title = bytesToSize(fs[0].used) + ' / ' + bytesToSize(fs[0].size);
				$('#driveUsage').attr('title', title);
				//$('#driveUsage').tooltip();

				toggle($('#driveUsage'), driveUsed);

				$('[data-toggle="tooltip"]').tooltip()
  
				resolve();
			}		    
		  });
		});
	}

	toggle = function($el, value) {
		if (value > 75 && value < 90) {			
			$el.removeClass('text-success');
			$el.removeClass('text-danger');
			$el.addClass('text-warning');
		} else if (value >= 90) {
			$el.removeClass('text-success');
			$el.removeClass('text-warning');
			$el.addClass('text-danger');
		}
		else {
			$el.removeClass('text-warning');
			$el.removeClass('text-danger');
			$el.addClass('text-success');
		}
	}

	function bytesToSize(a,b){if(0==a)return"0 Bytes";var c=1024,d=b||2,e=["Bytes","KB","MB","GB","TB","PB","EB","ZB","YB"],f=Math.floor(Math.log(a)/Math.log(c));return parseFloat((a/Math.pow(c,f)).toFixed(d))+" "+e[f]}

	function pad(n) {
    	return ('0' + n).slice(-2);
  	}
})
