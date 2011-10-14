var   express        = require('express')
    , io             = require('socket.io')
    , pub            = '/home/andrew/workspace/neemo/NEEMO/app/lib/neemo/public'
    , _              = require('underscore')
    , Step           = require('step')
    , sys            = require('sys')
    , fs             = require("fs")
    , path           = require("path")
    , querystring    = require('querystring')
    , OAuth          = require('oauth').OAuth
    , cartodb        = require('./cartodb')
    , RedisStore     = require('connect-redis')(express)
    , store          = new RedisStore();

module.exports = function(){
    
    require(global.settings.app_root + '/settings');
    var app = express.createServer(
            express.cookieParser(),
            express.session({ 
                secret: "string",  //TODO use a real secret
                store: store,
                cookie: { 
                    maxAge: 60*60*24*30*1000
                }
            })
    );
   
    app.use('/js', express.static(global.settings.app_root + '/public/js'));
    app.use('/images', express.static(global.settings.app_root + '/public/images'));
    app.use('/css', express.static(global.settings.app_root + '/public/css'));
    app.use('/fonts', express.static(global.settings.app_root + '/public/fonts'));
    app.use('/srcimages', express.static(global.settings.app_root + '/public/srcimages'));
    app.use(require('./cas_middleware').start(store));
    app.use('/regions', express.static(global.settings.app_root + '/public/regions'));
    app.use(express.static(global.settings.app_root + '/public'));
    app.use(express.bodyParser());
    app.use(express.logger({buffer:true, format:'[:remote-addr :date] \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:status :response-time ms -> :res[Content-Type]\033[0m'}));

    cartodb.start(function(){
        require('./dirtsock').start(io.listen(app), this, store);
    });
    return app;
};

