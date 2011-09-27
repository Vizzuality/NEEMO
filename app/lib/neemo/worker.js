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
    , rsub        = redis.createClient()
    , rsto        = redis.createClient();
    
exports.start = function(io) {
    rsub.stream.addListener('connect', function(){
        rsub.subscribeTo("poi-emit", 
            function (channel, data) {
                data = JSON.parse(data);
                io.sockets.in(data.region).emit('update', data);
                rsto.rpush( 'poi-store', JSON.stringify( data ), function(){ console.log('pussssssshhhed')});
        });
    });
    /*
    function popFromQueue() {
      rsub.lpop('emit-queue', handleEmit);
    }
    rsub.stream.addListener('connect', function(){
      popFromQueue();
    });
    
    function handleEmit(err, data) {
      if (data == null) {
        setTimeout(function() { popFromQueue(); }, 100);
      } else {
        data = JSON.parse(data);
        io.sockets.in(data.region).emit('update', data);
        popFromQueue();
      }
    }
    */
}
