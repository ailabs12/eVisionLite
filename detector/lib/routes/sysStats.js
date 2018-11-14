var express = require('express');
var si = require('systeminformation');
var path = require('path');
var fs = require('fs');

module.exports = function(app, params) {

	app.get('/api/sysinfo', async function(req, res, next) {
		if (req.xhr) {
			try {
				const currentLoad = await si.currentLoad();
				const mem = await si.mem();
				const fsSize = await si.fsSize();
				res.json({
					'currentLoad': currentLoad,
					'mem': mem,
					'fsSize': fsSize
				});
				} catch (e) {
					res.json(e)
				}
		} else {
		  res.redirect('/');
		}
	});
}
