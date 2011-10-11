var path = require('path');
module.exports.name             = 'production';
module.exports.redis            = {host: '127.0.0.1', 
                                   port: 6379, 
                                   idleTimeoutMillis: 1,
                                   reapIntervalMillis: 1};
module.exports.app_root = path.join(__dirname, '../..');
module.exports.user_table     = 'neemo_users';
module.exports.activity_table = 'neemo_activity';
module.exports.main_table     = 'neemo';
module.exports.neemo_port   = 8080;