var express = require('express');
var path = require('path');
var fs = require('fs');

module.exports = function(app, params) {

    app.get('/', function(req, res, next) {
        if (!req.session.authenticated)
            return res.redirect('/login.html');
        else next();
    });

    app.get('/login', function(req, res, next) {
        var _login, _password;

        fs.readFile(process.env.AUTH_SETTINGS, function(err, data) {
            try {
                data = JSON.parse(data);
                if (!req.session.authenticated) {
                    if (req.query.login == data.login && req.query.password == data.password) {
                        req.session.authenticated = true;
                        return res.redirect('/');
                    } else {
                        return res.redirect('/login.html');
                    }
                } else return res.redirect('/');
            } catch (e) {
                console.log(e);
            }
        });
    });

    app.get('/logout', function(req, res, next) {
        delete req.session.authenticated;
        return res.redirect('/');
    });
}
