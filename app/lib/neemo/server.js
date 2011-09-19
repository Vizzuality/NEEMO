var   express     = require('express')
    , grainstore  = require('grainstore')
    , RenderCache = require('./render_cache')
    , _           = require('underscore')
    , Step        = require('step')
    , fs          = require("fs")
    , path        = require("path");



module.exports = function(opts){
    var opts = opts || {};

    // initialize core mml_store
    //var mml_store  = new grainstore.MMLStore(opts.redis, opts.grainstore);

    // initialize render cache 60 seconds TTL
    //var render_cache = new RenderCache(60000, mml_store);

    // initialize express server
    var app = express.createServer();
    app.enable('jsonp callback');
    app.use(express.bodyParser());
    app.use(express.logger({buffer:true,
        format:'[:remote-addr :date] \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:status :response-time ms -> :res[Content-Type]\033[0m'}));

    var io = require('socket.io').listen(app);
    
    // take in base url and base req2params from opts or throw exception
    if (!_.isString(opts.base_url) || !_.isFunction(opts.req2params)) throw new Error("Must initialise Neemo with a base URL and req2params function");
    _.extend(app, opts);

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
    // canary route
    app.get('/', function(req, res){
        res.send('Hello World');
    });
	app.use('/images', express.static('/viewer/images'));
    // root route
    app.get('/:f.html', function(req, res){
		var f = '/viewer/' + req.params.f + '.html';
		renderStatic(f,req,res);
	});
    
    var emitTime = function(socket){
	   var currentTime = new Date();
	   socket.emit('time', 
			{ current:  currentTime.getHours()
						+ ':' + 
						currentTime.getMinutes()
						+ ':' +
						currentTime.getSeconds() });
	   setInterval(function(socket){emitTime(socket)}, 10000);
	}
	
    io.sockets.on('connection', function (socket) {
	   emitTime(socket);
	   socket.on('my other event', function (data) {
   		console.log(data);
	   });
	 });
    
    return app;
};
