module.exports.name             = 'development';
module.exports.postgres         = {user: 'postgres', host: '127.0.0.1', port: 5432};
module.exports.redis            = {host: '127.0.0.1', 
                                   port: 6379, 
                                   idleTimeoutMillis: 1,
                                   reapIntervalMillis: 1};
module.exports.windshaft_port   = 8080;