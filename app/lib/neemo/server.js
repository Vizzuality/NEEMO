var   express     = require('express')
    , grainstore  = require('grainstore')
    , RenderCache = require('./render_cache')
    , _           = require('underscore')
    , Step        = require('step');

module.exports = function(opts){
    var opts = opts || {};

    // initialize core mml_store
    var mml_store  = new grainstore.MMLStore(opts.redis, opts.grainstore);

    // initialize render cache 60 seconds TTL
    var render_cache = new RenderCache(60000, mml_store);

    // initialize express server
    var app = express.createServer();
    app.enable('jsonp callback');
    app.use(express.bodyParser());
    app.use(express.logger({buffer:true,
        format:'[:remote-addr :date] \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:status :response-time ms -> :res[Content-Type]\033[0m'}));


    // take in base url and base req2params from opts or throw exception
    if (!_.isString(opts.base_url) || !_.isFunction(opts.req2params)) throw new Error("Must initialise Neemo with a base URL and req2params function");
    _.extend(app, opts);

    // canary route
    app.get('/', function(req, res){
        res.send('Hello World');
    });

    // Get Map Style
    // can specify a jsonp callback
    app.get(app.base_url + '/style', function(req, res){
        var mml_builder;

        Step(
            function(){
                app.req2params(req, this);
            },
            function(err, data){
                if (err) throw err;

                mml_builder = mml_store.mml_builder(req.params);
                mml_builder.getStyle(this);
            },
            function(err, data){
                if (err){
                    res.send(err, 500);
                } else {
                    res.send({style: data.style}, 200);
                }
            }
        );
    });

    return app;
};
