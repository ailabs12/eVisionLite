var express = require('express');
var path = require('path');
var fs = require('fs');

var node_path = process.env.node_path;

//var staticFolder = path.join(__dirname + '../../../../../web');
var staticFolder = path.join(__dirname + '../../../web');
var dataFolder = node_path || path.join(__dirname + '../../../data');

//console.log(staticFolder,dataFolder);

module.exports = function(app, params) {
    app.get('/', function(req, res, next) {
        if (!req.session.authenticated && params.password)
            return res.redirect('/login.html');
        next();
    });

    app.use(express.static(staticFolder));
    app.use(express.static(dataFolder));

    app.get('/login', function(req, res, next) {

        if (req.query.password == params.password) {
            req.session.authenticated = true;
            res.redirect('/');
        } else {
            res.redirect('/login.html');
        }
    });

    app.get('/logout', function(req, res, next) {
        delete req.session.authenticated;
        res.redirect('/');
    });    

    app.use(function(req, res, next) {
        if (req.query.password == params.password || !params.password) {
            req.session.authenticated = true;
        };

        if (req.session.authenticated ||
            (req.path == '/api/users' && req.query.action == 'insert')
        ) {
            next();
        } else {
            res.json({
                success: false,
                msg: "Authentication failed"
            });
        }
    });

    app.get('/restart', function(req, res, next) {
        //res.redirect('/');
	res.send('<meta http-equiv="refresh" content="3;/">');
        setTimeout(function(){process.exit();},0)
    });
}
