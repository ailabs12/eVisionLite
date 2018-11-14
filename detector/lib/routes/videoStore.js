var express = require('express');
var path = require('path');
var fs = require('fs');

var node_path = process.env.node_path;
var dataFolder = node_path || path.join(__dirname + '../../../data');

module.exports = function(app, params) {

  app.get('/api/videos', function(req, res, next) {
    if (req.xhr) {
      let videos = [];
      fs.readdirSync(dataFolder + '/videos/').forEach(file => {
        videos.push(file);
      });
      res.json(videos);
    } else {
      res.redirect('/');
    }
  });
}
