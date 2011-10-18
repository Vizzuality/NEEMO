var   sys         = require('sys')
    , fs          = require("fs")
    , path        = require("path")
    , querystring = require('querystring')
    , OAuth       = require('oauth').OAuth;

exports.start = function(callback){
    require(global.settings.app_root + '/cartodb_settings');
    //eval(fs.readFileSync('cartodb_settings.js', encoding="ascii"));
    
    cartodb.callback = callback;
    
    cartodb.oa = new OAuth(cartodb.request_url,
                       cartodb.access_url,
                       cartodb.consumer_key,
                       cartodb.consumer_secret,
                       "1.0",
                       cartodb.callback,
                       "HMAC-SHA1");
    
    cartodb.oa = new OAuth(cartodb.request_url, cartodb.access_url, cartodb.consumer_key, cartodb.consumer_secret, "1.0", null, "HMAC-SHA1");
    
    // Request temporary request tokens
    cartodb.oa.getOAuthRequestToken(function(error, request_key, request_secret, results){
        if(error) {
            sys.puts('error :' + error);
        } else {
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
                        if(error) {
                            sys.puts(require('sys').inspect(error));
                            throw new Error("...XAuth failed. Please check your password and username.");
                        } else {
                            sys.puts('\n== CartoDB result for POST "' + cartodb.private_query + '" ==');
                            sys.puts(data + '\n');
                            cartodb.callback();
                        }
                    });
                }
            });
        }
    });
    return cartodb;
};

