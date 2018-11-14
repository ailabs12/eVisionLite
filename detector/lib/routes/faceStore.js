var Faces = require('../face');
module.exports = function(app, params) {

    app.get('/api/users', function(req, res) {

        if (req.query.action == 'insert' &&
            ('image' in req.query) &&
            ('descriptor' in req.query) &&
            ('name' in req.query)) {
            Faces.insert(req.query);
            return res.json({
                success: true
            })
        }

        if (req.query.action == 'edit' &&
            ('id' in req.query) &&
            ('name' in req.query)) {
            Faces.update(req.query);
            return res.json({
                success: true,
                data: req.query
            })
        }

        if (req.query.action == 'delete' &&
            ('id' in req.query)) {
            Faces.remove(req.query.id);
            return res.json({
                success: true,
                data: req.query
            })
        }

        return res.json(Faces.get())
    });

    app.get('/api/settings', function(req, res) {
        res.jsonp(params)
    });

    app.get('/api/logs', function(req, res) {
        Faces
            .getLog(req.query)
            .then(function(data) {
                res.json(data)
            }, function(e) {
                res.json(e)
            })
    });
}
