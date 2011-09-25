var   express     = require('express')
    //, RedisPool   = require("./redis_pool")
    , io          = require('socket.io')
    , _           = require('underscore')
    , Step        = require('step')
    , fs          = require("fs")
    , path        = require("path")
    , redis       = require('redis-client')
    , https       = require("https")
    , http        = require("http")
    , querystring = require('querystring')
    , rsub        = redis.createClient();
    
exports.start = function(io, cartodb) {
    rsub.stream.addListener('connect', function(){
        rsub.subscribeTo("poi", 
            function (channel, data) {
                data = JSON.parse(data);
                io.sockets.in(data.region).emit('update', data);
                /*
                    //TODO: ship new data to CartoDB
                    var query = "INSERT INTO neemo (region) VALUES (1);";
                    var domain = 'https://andrew.cartodb.com';
                    //var qq = "INSERT%20INTO%20neemo%20(region)%20VALUES%20(1)";
                    var post_data = querystring.stringify({
                          'q': query
                      });
                    //console.log([domain,'api/v1/sql?oauth_token=', cartodb.oauth_token, "&q=", query].join(''));
                    var post_options = {
                          host: domain,
                          path: ['/api/v1/sql?oauth_token=', cartodb.oauth_token].join(''),
                          method: 'POST',
                      };
                    var url = [domain,
                               '/api/v1/sql?oauth_token=',
                               cartodb.oauth_token,
                               '&',
                               post_data].join('');
                    cartodb.oa.get(url, cartodb.oauth_token, cartodb.oauth_token_secret, function(error,data){
                        console.log(error);
                        console.log(data);
                    });
                */
        });
        
    });
}
