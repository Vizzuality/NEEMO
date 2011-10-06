
var Test = require('./lib/neemo');
var config = {
        base_url: '/',
        redis: {host: '127.0.0.1', port: 6379}
    };

// Initialize tile server on port 4000
var ws = new Test.CasTest(config);
ws.listen(4000);

console.log("NEEMO is now being served out of: http://localhost:4000" + config.base_url );
