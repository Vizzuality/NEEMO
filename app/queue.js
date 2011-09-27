
var Neemo = require('./lib/neemo');
var config = {
        base_url: '/queue',
        redis: {host: '127.0.0.1', port: 6379}
    };

// Initialize tile server on port 4000
var ws = new Neemo.Queue(config);
ws.listen(4001);

console.log("NEEMO Queue is now being served out of: http://localhost:4001" + config.base_url );
