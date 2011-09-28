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
            //socket.set('region', data.region );
            socket.join(data.region);
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
