
var Neemo = require('../lib/neemo');
var config = {
        base_url: '/',
        req2params: function(req, callback){req.params.interactivity = 'id'; callback(null,req)},
        grainstore: {datasource: {user:'postgres', host: '127.0.0.1', port: 5432}}, //see grainstore npm for other options
        redis: {host: '127.0.0.1', port: 6379}
    };

// Initialize tile server on port 4000
var ws = new Neemo.Server(config);
ws.listen(4000);

console.log("NEEMO is now being served out of: http://localhost:4000" + config.base_url );
