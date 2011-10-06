var   Step        = require('step')
    , _           = require('underscore')
    , redis       = require('redis-client')
    , rpub        = redis.createClient();
// Sets up the socket server
exports.start = function(io, cartodb, store) {
    var validateSession = function(key){
        var s = JSON.stringify(data);
        var hmac = crypto.createHmac("sha1", key);
        var hash2 = hmac.update(s);
        var digest = hmac.digest(encoding="base64");

        return true;
    }
    /* Setup main App socket connections and functions
     */
    io.sockets.on('connection', function (socket) {
        var session_id = socket.id;
        /* TODO
         * SETUP socket.once
         * that recieves the username/auth string
         * if valid, stores it with the socket.id
         */
        socket.once('message', function(data){
            console.log('hihi');
            console.log('hihi');
            console.log('hihi');
            console.log('hihi');
            console.log(data);
            console.log(data);
            console.log(data);
            console.log(data);
            console.log(data);
            //validate key here
            user_profile = {
                user_id: 'andrewxhill',
                user_rank: 1,
                user_lvl: 11,
                user_pts: 17600,
                user_latest: [
                    {points: "+5", title: "You have found a new coral occurrence"},
                    {points: "+5", title: "You have found a new coral occurrence"},
                    {points: "+1", title: "You have confirmed a new coral occurrence"},
                    {points: "+5", title: "You have found a new coral occurrence"}
                ]
            }
            socket.emit('user-metadata', user_profile);
        });
        socket.on('join', function (data) {
            socket.join(data.region);
            /* Send a CartoDB SQL request here
             *
             */
            socket.emit('region-metadata', {
                  region_id: data.region,
                  meters_left: 239+data.region,
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
    
    require('./scoreboard').start(io, cartodb, store);
    require('./worker').start(io, cartodb);
}
