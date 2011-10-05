var   Step        = require('step')
    , _           = require('underscore')
    , redis       = require('redis-client')
    , rpub        = redis.createClient();
    
// Sets up the socket server
exports.start = function(io, cartodb) {
    /* Setup main App socket connections and functions
     */
    io.sockets.on('connection', function (socket) {
        socket.send(socket.id);
        socket.on('join', function (data) {
            socket.join(data.region);
            /* Send a CartoDB SQL request here
             *
             */
            socket.emit('region-metadata', {
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
        });
	    socket.on('poi', function (data) {
            rpub.publish( 'poi-emit', JSON.stringify( data ));
        });
    });
    
    require('./scoreboard').start(io, cartodb);
    require('./worker').start(io, cartodb);
}
