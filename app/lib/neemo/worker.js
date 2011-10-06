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
    , rsub        = redis.createClient() //listens to all socket bases poi incoming
    , rsto        = redis.createClient(); //for storing incoming poi that the queue processes and sends to cartodb
    
exports.start = function(io, cartodb) {
    rsub.stream.addListener('connect', function(){
        /* this is broken off from the main Socket classes because we may want to completely decouple it
         * from the application to free up some speed
         */
        rsub.subscribeTo("poi-emit", 
            function (channel, data) {
                data = JSON.parse(data);
                io.sockets.in(data.region).emit('region-new-data', data);
                /* 
                 * Send POI to CartoDB here 
                 */
                //rsto.rpush( 'poi-store', JSON.stringify( data ), function(){});
            }
        );
    });
    
    var fakeEmit = function(){
        /* sends random updates */
        var id = Math.floor(Math.random()*11);
        
        io.sockets.in(id).emit('region-new-data', {
        //io.sockets.in(id).emit('update-totals', {
            region_id: id,
            eventType: 'points',
            categories: [
                    {
                        id: 'fish',
                        name: 'fish',
                        count: Math.floor(Math.random()*2),
                        items: []
                    },
                    {
                        id: 'coral',
                        name: 'coral',
                        count: Math.floor(Math.random()*2),
                        items: []
                    },
                    {
                        id: 'other',
                        name: 'other',
                        count: Math.floor(Math.random()*2),
                        items: []
                    }
            ]
        });
        setTimeout(function(){fakeEmit()}, 500);
    }
    //fakeEmit();
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
