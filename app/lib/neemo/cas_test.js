var   express     = require('express')
    , _           = require('underscore')
    , Step        = require('step')
    , sys         = require('sys')
    , fs          = require("fs")
    , path        = require("path")
    , CAS         = require('cas')
    , querystring = require('querystring')
    , csa         = {login: 'https://login.zooniverse.org', logout: 'https://login.zooniverse.org/logout', service: 'http://68.175.5.167:4000'}
    , users       = {};

module.exports = function(opts){
    var opts = opts || {},
        cas  = new CAS({base_url: csa.login, service: csa.service});
    
    var cas_middleware = function(req, res, next){
        var ticket = req.param('ticket'),
            route  = req.url;
            
        if (route == '/index.html' || route == '/' || route == '/about.html' || route == '/favicon.ico') {
            next();
        } else if (route == '/logout' ){
            req.session.user = null;
            res.redirect(csa.logout + '?service=' + csa.service);
        } else if (req.session.user && req.session.user.username){
            next();
        } else {
            if (ticket) {
                cas.validate(ticket, function(err, status, username) {
                  if (err) {
                    res.send({error: err});
                  } else {
                    if (status) {
                        req.session.user = { 
                            username: username,
                            status:  status,
                        }
                    }
                    res.redirect('/');
                  }
                });
            } else {
                res.redirect(csa.login + '?service=' + csa.service);
            }
        }
    };
    
    // initialize express server
    var app = express.createServer();
    app.use(express.cookieParser());
    
    //app.use(express.bodyParser());
    app.use(express.session({ secret: "string" }));
    app.use('/js', express.static('./public/js'));
    app.use('/images', express.static('./public/images'));
    app.use('/css', express.static('./public/css'));
    app.use('/regions', express.static('./public/regions'));
    app.use(cas_middleware);
    app.use(express.static('./public'));
    app.use(express.logger({buffer:true, format:'[:remote-addr :date] \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:status :response-time ms -> :res[Content-Type]\033[0m'}));
    
    return app;
};

