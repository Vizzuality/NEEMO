var   Step        = require('step')
    , _           = require('underscore')
    , redis       = require('redis-client')
    , rpub        = redis.createClient();
    
// Sets up the socket server
exports.start = function(io, cartodb) {
    //var redis_pool = new RedisPool();
    io.sockets.on('connection', function (socket) {
        socket.send(socket.id);
        socket.on('join', function (data) {
            console.log('join');
            socket.set('region', data.region );
            socket.join(data.region);
	    });
	    socket.on('poi', function (data) {
            console.log('published');
            rpub.publish( 'poi', JSON.stringify( data ));
        });
    });
    
    require('./worker').start(io, cartodb);
}
