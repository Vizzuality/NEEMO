var   Step        = require('step')
    , _           = require('underscore')
    , redis       = require('redis-client')
    , rpub        = redis.createClient();
    
// Sets up the socket server
exports.start = function(io) {
    //var redis_pool = new RedisPool();
    io.sockets.on('connection', function (socket) {
        socket.send(socket.id);
        socket.on('join', function (data) {
            console.log('hoined');
            //socket.set('region', data.region );
            socket.join(data.region);
            //here would ask CartoDB for the totals
            socket.emit('regionOverview', {
                  region_id: data.region,
                  categories: [
                    {
                        id: 'fish',
                        name: 'fish',
                        count: Math.floor(Math.random()*101)
                    },
                    {
                        id: 'coral',
                        name: 'coral',
                        count: Math.floor(Math.random()*101)
                    },
                    {
                        id: 'other',
                        name: 'other',
                        count: Math.floor(Math.random()*101)
                    }
                  ]
            });
	    });
        socket.on('leave', function (data) {
            socket.leave('/'+data.region)
            socket.leave('/'+data.region + 1);
            socket.leave('/'+(data.region - 1));
        });
	    socket.on('poi', function (data) {
            rpub.publish( 'poi-emit', JSON.stringify( data ));
        });
    });
    
    require('./worker').start(io);
}
