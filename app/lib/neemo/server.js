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
    console.log(pub);
        //app.enable('jsonp callback');
    app.use(express.bodyParser());
    //app.use(express.methodOverride());
    app.use(express.cookieParser());
    //app.use(express.session({ secret: "cartodb!", store: new RedisStore }));
    app.use('/js', express.static('./public/js'));
    app.use('/images', express.static('./public/images'));
    app.use('/css', express.static('./public/css'));
    app.use(express.static('./public'));
    //app.use(express.static(pub));
    app.use(express.logger({buffer:true, format:'[:remote-addr :date] \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:status :response-time ms -> :res[Content-Type]\033[0m'}));
    
    /*
    // canary route
    app.get('/', function(req, res){
        res.send('Hello World');
    });
    */
    
    //_.extend(app, opts);
    
    /*
	var renderStatic = function(f, req, res){
	  var filename = path.join(process.cwd(), f);
	  path.exists(filename, function(exists) {
		if(!exists) {
		  res.writeHead(404, {"Content-Type": "text/plain"});
		  res.write("404 Not Found\n"+filename);
		  res.end();
		  return;
		}

		if (fs.statSync(filename).isDirectory()) filename += '/index.html';

		fs.readFile(filename, "binary", function(err, file) {
		  if(err) {        
			res.writeHead(500, {"Content-Type": "text/plain"});
			res.write(err + "\n");
			res.end();
			return;
		  }
		  res.writeHead(200);
		  res.write(file, "binary");
		  res.end();
		});
	  });
    }
    
    */
    /*
	app.use('/images', express.static(__dirname+'/static/images'));
	app.use('/css', express.static(__dirname+'/static/css'));
	app.use('/js', express.static(__dirname+'/static/js'));
	app.use('/favicon.ico', function(req, res){
		var f = '/static/favicon.ico';
		renderStatic(f,req,res);
	});
    */
    /*
    // root route
    app.get('/:f.html', function(req, res){
		var f = '/static/' + req.params.f + '.html';
		renderStatic(f,req,res);
	});
    */
    /*
    app.post('/submit/poi', function(req, res){
        var   geojson
            , type;
        Step(
            function(){
                app.req2params(req, this);
            },
            function(err, data){
                if (err) throw err;
                geojson = data.point
                type = data.type
            },
            function(err, data){
                //store geojson in redis. have listener to 
                //take the new geojson and ship to postgres
                //and a socket to ship to all subscribers
            }
        );
    });
    app.post('/submit/geom', function(req, res){
        var   geojson
            , type;
        Step(
            function(){
                app.req2params(req, this);
            },
            function(err, data){
                if (err) throw err;
                geojson = data.geom
                type = data.type
            },
            function(err, data){
                //store geojson in redis. have listener to 
                //take the new geojson and ship to postgres
                //and a socket to ship to all subscribers
            }
        );
    });
    app.post('/submit/cls', function(req, res){
        var   geojson
            , type;
        Step(
            function(){
                app.req2params(req, this);
            },
            function(err, data){
                if (err) throw err;
                geojson = data.geom
                type = data.type
            },
            function(err, data){
                //store geojson in redis. have listener to 
                //take the new geojson and ship to postgres
                //and a socket to ship to all subscribers
            }
        );
    });
    */
    require('./dirtsock').start(io.listen(app));
    return app;
};

