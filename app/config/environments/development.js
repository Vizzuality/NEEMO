var path = require('path');
module.exports.name             = 'development';
module.exports.redis            = {host: '127.0.0.1', 
                                   port: 6379, 
                                   idleTimeoutMillis: 1,
                                   reapIntervalMillis: 1};
module.exports.app_root = path.join(__dirname, '../..');
module.exports.user_table     = 'neemo_users_dev';
module.exports.activity_table = 'neemo_activity_dev';
module.exports.main_table     = 'neemo_dev';
module.exports.neemo_port   = 4000;