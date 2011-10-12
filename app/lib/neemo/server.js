var   express     = require('express')
    //, RedisPool   = require("./redis_pool")
    , io          = require('socket.io')
    , pub         = '/home/andrew/workspace/neemo/NEEMO/app/lib/neemo/public'
    , _           = require('underscore')
    , Step        = require('step')
    , sys         = require('sys')
    , fs          = require("fs")
    , path        = require("path")
    //, https       = require("https")
    , querystring = require('querystring')
    , crypto      = require('crypto')
    , CAS         = require('cas')
    , csa         = {login: 'https://login.zooniverse.org', 
                     logout: 'https://login.zooniverse.org/logout'}
    , OAuth       = require('oauth').OAuth
    , cartodb     = require('./cartodb')
    , Base64      = require('./Base64')
    , RedisStore  = require('connect-redis')(express)
    , store       = new RedisStore();

module.exports = function(){
    
    require(global.settings.app_root + '/settings');
    
    csa.service = neemo.route_url;
    cas  = new CAS({base_url: csa.login, service: csa.service});


                  
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
            res.redirect(csa.logout + '?service=' + csa.service);
        } else if (route == '/login' ){
            res.redirect(csa.login + '?service=' + csa.service);
        } else if (req.session && req.session.loggedin){
            if (ticket) {
              cas.validate(ticket, function(err, status, username) {
                  if (err) {
                     res.redirect('/');
                  } else{
                     res.redirect('/mission.html');
                  }
              });
            }
            next();
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
                res.redirect(csa.login + '?service=' + csa.service);
            }
        }
        
    };
    
    var privateKey, certificate, ca;
    // initialize express server
    //privateKey = fs.readFileSync(global.settings.app_root + '/../key.key').toString();
    //certificate = fs.readFileSync(global.settings.app_root + '/../cert.crt').toString();
    //ca = fs.readFileSync(global.settings.app_root + '/../gd.crt').toString();
    
    //{key:privateKey,cert:certificate,ca:ca},
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
    app.use(cas_middleware);
    app.use('/regions', express.static(global.settings.app_root + '/public/regions'));
    app.use(express.static(global.settings.app_root + '/public'));
    app.use(express.bodyParser());
    app.use(express.logger({buffer:true, format:'[:remote-addr :date] \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:status :response-time ms -> :res[Content-Type]\033[0m'}));

    cartodb.start(function(){
        //require('./dirtsock').start(io.listen(app, {key:privateKey,cert:certificate,ca:ca}), this, store);
        require('./dirtsock').start(io.listen(app), this, store);
        
        /*
        eval(fs.readFileSync('./config/newtracks.js', encoding="ascii"));
        doc = {};
        var track = 1;
        var protected_request = this.api_url;
        var dirr, mis, query, region, filee, tra;
        for (i in existingtracks){
            dirr = existingtracks[i].directory,
            mis = '20110503_Neemo2';
            query = "";
            region = 1;
            regions = []
            for (k in existingtracks[i].files) {
                filee = existingtracks[i].files[k];
                url = dirr+'/'+filee;
                regions.push(url);
                //query = query + "INSERT INTO neemo_regions (image_url, original_mission, original_directory, original_file, track, region) VALUES " +
                //                    "('"+url+"','"+mis+"','"+dirr+"','"+filee+"',"+track+","+region+"); ";
                region++;
            }
            doc[track] = regions;
            //body = {q: query}
            //this.oa.post(protected_request, this.access_key, this.access_secret, body, null);
            console.log(track);
            console.log(region);
            track++;
        }
        
        fs.writeFile("./public/regions/tracks.js", "var tracks = " + JSON.stringify(doc), function(err) {
            if(err) {
                sys.puts(err);
            } else {
                sys.puts("The file was saved!");
            }
        }); 
        */
    });
    return app;
};

