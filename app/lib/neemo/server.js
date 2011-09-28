var   express     = require('express')
    //, RedisPool   = require("./redis_pool")
    , io          = require('socket.io')
    , pub         = '/home/andrew/workspace/neemo/NEEMO/app/lib/neemo/public'
    , _           = require('underscore')
    , Step        = require('step')
    , fs          = require("fs")
    , path        = require("path")
    , querystring = require('querystring')
    , RedisStore  = require('connect-redis')(express);

module.exports = function(opts){
    var opts = opts || {};
    // initialize express server
    var app = express.createServer();
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use('/js', express.static('./public/js'));
    app.use('/images', express.static('./public/images'));
    app.use('/css', express.static('./public/css'));
    app.use(express.static('./public'));
    app.use(express.logger({buffer:true, format:'[:remote-addr :date] \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:status :response-time ms -> :res[Content-Type]\033[0m'}));
    
    require('./dirtsock').start(io.listen(app));
    return app;
};

