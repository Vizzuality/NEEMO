var path = require('path');
module.exports.name             = 'development';
module.exports.redis            = {host: '127.0.0.1', 
                                   port: 6379, 
                                   idleTimeoutMillis: 1,
                                   reapIntervalMillis: 1};
module.exports.app_root = path.join(__dirname, '../..');
module.exports.neemo_port   = 4000;