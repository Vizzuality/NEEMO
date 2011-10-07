var   Step        = require('step')
    , _           = require('underscore')
    , redis       = require('redis-client')
    , crypto      = require('crypto')
    , rpub        = redis.createClient();
// Sets up the socket server
exports.start = function(io, cartodb, store) {
    var validateSession = function(input){
        var key = "superSecretKey";
        var data = input.substr(0,44);
        var hash = input.substr(44,28);
        
        var hmac = crypto.createHmac("sha1", key);
        var hash2 = hmac.update(data);
        var digest = hmac.digest(encoding="base64");
        if (digest==data){
            return true;
        }else{
            return true;
        }
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
            data = JSON.parse(data);
            if (validateSession(data.auth)){
                //perform a create or get here!
                var protected_request = cartodb.api_url;
                var query = "SELECT user_id, user_lvl, user_rank, user_score, user_progress FROM neemo_users WHERE user_id = '"+data.username+"' LIMIT 1;";
                var body = {q: query}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, result, response) {
                    //console.log('\n== CartoDB result for NEEMO get "' + query + '" ==');
                    //console.log(result + '\n');
                    result = JSON.parse(result);
                    if (result.total_rows == 0){
                        user_profile = {
                            user_id: data.username,
                            user_rank: 0,
                            user_lvl: 1,
                            user_pts: 1,
                            user_progress: 1,
                            user_latest: [
                                {points: 1, title: "welcome to neemo!"}
                            ]
                        };
                        socket.emit('user-metadata', user_profile);
                        var q2 = "INSERT INTO neemo_users (user_id, user_lvl, user_rank, user_score, user_progress) VALUES ('"+data.username+"', 1, (SELECT count(*)+1 FROM neemo_users), 0, 1)";
                        var b2 = {q: q2};
                        cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, b2, null);
                    } else {
                        user_profile = {
                            user_id: result.rows[0].user_id,
                            user_rank: result.rows[0].user_rank,
                            user_lvl: result.rows[0].user_lvl,
                            user_pts: result.rows[0].user_score,
                            user_progress: result.rows[0].user_progress,
                            user_latest: [
                                {points: 0, title: "welcome back to neemo!"}
                            ]
                        }
                        socket.emit('user-metadata', user_profile);
                    }
                });
            }
        });
        socket.on('join', function (data) {
            socket.leave((data.region-1));
            socket.leave((data.region+1));
            socket.join(data.region);
            /* Send a CartoDB SQL request here
             *
             */
            //TODO: Create a view on CartoDB that gives updated summary stats for each region
            //placeholder
            socket.emit('region-metadata', {
                region: data.region,
                meters: (400 - (4*data.region)),
                annotations: [
                    {name: 'gorgonian', total: 8 + Math.floor(Math.random()*10)},
                    {name: 'coral', total: 15 + Math.floor(Math.random()*10)},
                    {name: 'barrel', total: 10 + Math.floor(Math.random()*10)},
                    {name: 'other', total: 10 + Math.floor(Math.random()*10)}
                ]
            });
            
            var protected_request = cartodb.api_url;
            var query = "SELECT category, click_x, click_y, width, height, region, user_id, upvotes, downvotes FROM neemo WHERE region = '"+data.region+"' ORDER BY created_at DESC LIMIT 10";
            var body = {q: query}
            cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function(error, data, response) {
                data = JSON.parse(data);
                for (i in data.rows){
                    
                    var out = { 
                        category: data.rows[i].category,
                        x: data.rows[i].click_x,
                        y: data.rows[i].click_y,
                        width: data.rows[i].width,
                        height: data.rows[i].height,
                        region: data.rows[i].region,
                        username: data.rows[i].user_id,
                        stored: true
                    }
                    socket.emit('region-new-data', out);
                }
            });
	    });
        socket.on('leave', function (data) {
            socket.leave('/'+data.region);
        });
	    socket.on('submit-data', function (data) {
            if (validateSession(data.auth)){
                //rpub.publish( 'poi-emit', JSON.stringify( data ));
                var protected_request = cartodb.api_url;
                var query = "INSERT INTO neemo (category, click_x, click_y, width, height, region, user_id, upvotes, downvotes) VALUES ('"+data.category+"',"+data.x+","+data.y+","+data.width+","+data.height+","+data.region+",'"+data.username+"', 1, 0)";
                var body = {q: query}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null);
                delete data['auth'];
                console.log(data);
                io.sockets.in(data.region).emit('region-new-data', data);
            }
        });
    });
    
    require('./scoreboard').start(io, cartodb, store);
    //require('./worker').start(io, cartodb);
}
