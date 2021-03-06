var   express     = require('express')
    , io          = require('socket.io')
    , _           = require('underscore')
    , Step        = require('step')
    , fs          = require("fs")
    , path        = require("path")
    , redis       = require('redis-client')
    , https       = require("https")
    , http        = require("http")
    , querystring = require('querystring')
    , sys         = require('sys')
    , rsub        = redis.createClient() //listens for new events to store on CartoDB
    , upub        = redis.createClient() //publishes updated rankings
    , OAuth       = require('oauth').OAuth
    , fs          = require('fs')
    , pageSize    = 15  //defines the users per page to store for Scoreboard
    , page        = 1   //init for counter
    , rankUpdate  = false;  //informs the rankupdate to pass when there haven't been updates
    
module.exports = function(opts){
    
    
    var app = express.createServer();
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.static('./public'));
    app.use(express.logger({buffer:true, format:'[:remote-addr :date] \033[90m:method\033[0m \033[36m:url\033[0m \033[90m:status :response-time ms -> :res[Content-Type]\033[0m'}));
    
    eval(fs.readFileSync('cartodb_settings.js', encoding="ascii"));
    
    cartodb.oa = new OAuth('http://andrew.cartodb.com/oauth/request_token',
                       'http://andrew.cartodb.com/oauth/access_token',
                       'J39kX9otGAp9zwFhZG8QuuajqAZXJ4HsXXvErEaF',
                       'BIZd2v7zgE6lmry7WIj2tjfMvFo1r4Madxv9PlkZ',
                       "1.0",
                       "http://68.175.5.167:4000/oauth/callback",
                       "HMAC-SHA1");
    
    cartodb.private_query     = 'SELECT ST_SRID(the_geom) FROM fisheryclosure LIMIT 1'
    cartodb.request_url       = 'https://' + cartodb.username + '.cartodb.com/oauth/request_token'
    cartodb.access_url        = 'https://' + cartodb.username + '.cartodb.com/oauth/access_token'
    cartodb.api_url           = 'https://' + cartodb.username + '.cartodb.com/api/v1/sql';
    
    cartodb.oa = new OAuth(cartodb.request_url, cartodb.access_url, cartodb.consumer_key, cartodb.consumer_secret, "1.0", null, "HMAC-SHA1");

    // Request temporary request tokens
    cartodb.oa.getOAuthRequestToken(function(error, request_key, request_secret, results){
        if(error) sys.puts('error :' + error);
        else {
            // Output consumer and request tokens (for completeness)
            sys.puts('\n== Consumer Tokens ==');
            sys.puts('consumer key :' + cartodb.consumer_key);
            sys.puts('consumer secret :' + cartodb.consumer_secret);

            sys.puts('\n== Request Tokens ==');
            sys.puts('request key :' + request_key);
            sys.puts('request secret :' + request_secret);

            // Configure XAuth request
            var xauth = {x_auth_mode:"client_auth", x_auth_username: cartodb.username, x_auth_password: cartodb.password };

            // Request access key and secret tokens via XAuth
            // ** NOTE: Do NOT post the request_secret in argument 3 **
            sys.puts("\nRequesting access tokens via XAuth...");
            cartodb.oa.post(cartodb.access_url, request_key, null, xauth, null, function(error, data) {
                if(error) {
                    sys.puts(require('sys').inspect(error));
                    throw new Error("...XAuth failed. Please check your password and username.");
                } else {
                    sys.puts("...XAuth successful!");

                    // Parse access tokens from returned query string
                    access_tokens = querystring.parse(data);
                    cartodb.access_key    = access_tokens['oauth_token'];
                    cartodb.access_secret = access_tokens['oauth_token_secret'];

                    // Output access tokens
                    sys.puts('\n== Access Tokens ==');
                    sys.puts('access key:' + cartodb.access_key);
                    sys.puts('access secret :' + cartodb.access_secret);

                    // Do a sample GET query
                    var protected_request = cartodb.api_url + "?q=" + querystring.escape(cartodb.private_query);
                    cartodb.oa.get(protected_request, cartodb.access_key, cartodb.access_secret,  function (error, data, response) {
                        sys.puts('\n== CartoDB result for GET "' + cartodb.private_query + '" ==');
                        sys.puts(data + '\n');
                    });

                    // Do a sample POST query
                    var protected_request = cartodb.api_url;
                    var body = {q: cartodb.private_query}
                    cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, data, response) {
                        sys.puts('\n== CartoDB result for POST "' + cartodb.private_query + '" ==');
                        sys.puts(data + '\n');
                    });
                    
                    processRankings();
                    processQueue();
                }
            });
        }
    });
    
    /* Takes all published POIs and Pushes them to CartoDB */
    function handleStorage(err, data) {
      if (data == null) {
        setTimeout(function() { processQueue(); }, 100);
      } else {
        data = JSON.parse(data);
        // Do a sample POST query
        var protected_request = cartodb.api_url;
        
        var ordered_columns = ['userkey', 'region', 'category', 'objtype', 'title', 'notes', 'the_geom', 'click_x', 'click_y']
        
        var query = "INSERT INTO neemo (" + ordered_columns.join(', ') + ") VALUES ('"+data.id+"',"+data.region+",'"+data.category+"','"+data.type+"','"+data.title+"','"+data.notes+"',GeometryFromText('POINT('|| "+data.lon+" ||' '|| "+data.lat+" ||')', 4326), "+data.click_x+", "+data.click_y+")";
        var body = {q: query}
        cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, data, response) {
            console.log('\n== CartoDB result for NEEMO put "' + query + '" ==');
            console.log(data + '\n');
        });
        rankUpdate = true;
        processQueue();
      }
    }
    function processQueue() {
      rsub.lpop('poi-store', handleStorage);
    }
    
    function handleRankings() {
        var protected_request = cartodb.api_url;
        var offset = pageSize * (page - 1)
        var query = "SELECT user_id, user_rank, user_lvl, poll FROM neemo_scores LIMIT "+pageSize+" OFFSET "+offset+";";
        var body = {q: query}
        cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, data, response) {
            data = JSON.parse(data);
            
            var output = {
                total_rows: data.total_rows,
                page: page,
                limit: pageSize,
                ranks: {}
            };
            for (i in data.rows){
                var u = {
                    user_id: data.rows[i].user_id,
                    user_rank: data.rows[i].user_rank,
                    user_lvl: data.rows[i].user_lvl
                }
                output.ranks[data.rows[i].poll] = u;
            }
            upub.publish('scoreboard-update', JSON.stringify( output ));
            
            if (data.total_rows == pageSize){
                page++;
            } else {
                rankUpdate = false;
                page = 1;
            }
        });
        
        setTimeout(function() { processRankings(); }, 100);
    }
    function processRankings() {
        if (page != 1 || rankUpdate){
            handleRankings();
        } else {
            setTimeout(function() { processRankings(); }, 25000);
        }
    }
    
    return app;
}
