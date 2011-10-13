var   sys         = require('sys')
    , CAS         = require('cas')
    , Base64      = require('./Base64')
    , crypto      = require('crypto')
    , cas         = new CAS({base_url: 'https://login.zooniverse.org', service: global.settings.route_url});

exports.start = function(store){
            
    /* forces CSA signin to do anything fun */
    var cas_middleware = function(req, res, next){
        var ticket = req.param('ticket'),
            route  = req.url;
        if (route.split('.ht').length > 1 || route == '/'){
            if (req.session){
                res.cookie('socketAuth', req.session.sid, { expires: new Date(Date.now() + 900000), httpOnly: false });
                res.cookie('neemoUser', req.session.username, { expires: new Date(Date.now() + 900000), httpOnly: false });
            } else {
                res.cookie('socketAuth', null, { expires: new Date(Date.now() + 90000), httpOnly: false });
                res.cookie('neemoUser', null, { expires: new Date(Date.now() + 90000), httpOnly: false });
            }
        }
        
        if (route == '/index.html' || route == '/' || route == '/about.html' || route == '/favicon.ico') {
            //TODO get session.id into the client Cookie, need to include it with Socket requests
            next();
        } else if (route == '/logout' ){
            req.session.destroy();
            res.cookie('socketAuth', null, { expires: new Date(Date.now() + 90000), httpOnly: false });
            res.cookie('neemoUser', null, { expires: new Date(Date.now() + 90000), httpOnly: false });
            //req.session.key = null;
            res.redirect('https://login.zooniverse.org/logout' + '?service=' + global.settings.route_url);
        } else if (route == '/login' ){
            res.redirect('https://login.zooniverse.org' + '?service=' + global.settings.route_url);
        } else if (req.session && req.session.loggedin){
            if (ticket) {
              cas.validate(ticket, function(err, status, username) {
                  if (err) {
                     res.redirect('/');
                  } else{
                     res.redirect('/mission.html');
                  }
              });
            } else {
                next();
            }
        } else {
            if (ticket) {
                cas.validate(ticket, function(err, status, username) {
                  if (err) {
                    res.send({error: err});
                  } else {
                    if (status) {
                        var data = {
                            username: username,
                            key: neemo.secret,
                        }
                        var s = JSON.stringify(data);
                        
                        var hash = crypto.createHmac('sha1', neemo.secret).update(s).digest('hex', encoding="base64");
                        req.session.sid = hash + Base64(s);
                        req.session.username = username;
                        req.session.loggedin = true;
                        req.session.cookie.expires = new Date(Date.now() + 3600000);
                        req.session.cookie.maxAge = 3600000;
                        store.set(req.session.sid , JSON.stringify({loggedin: status, username: username}));
                        res.redirect('/mission.html');
                    }  else {
                        res.redirect('/');
                    }
                  }
                });
            } else {
                res.redirect('https://login.zooniverse.org' + '?service=' + global.settings.route_url);
            }
        }
        
    };
    return cas_middleware;
};

