var   Step        = require('step')
    , _           = require('underscore')
    , redis       = require('redis-client')
    , crypto      = require('crypto')
    , rpub        = redis.createClient();
// Sets up the socket server
exports.start = function(io, cartodb, store) {
    var validateSession = function(input, username){
        var hash = input.substr(0,40),
            data = input.substr(40),
            shouldbe = {
                            username: username,
                            key: neemo.secret,
                        },
            s = JSON.stringify(shouldbe);
        var newhash = crypto.createHmac('sha1', neemo.secret).update(s).digest('hex', encoding="base64");
        console.log(username);
        if (newhash==hash){
            return true;
        }else{
            return false;
        }
    }
    /* Setup main App socket connections and functions
     */
    /*
    io.configure(function (){
      io.set('authorization', function (handshakeData, callback) {
        console.log('hiiiiiii');
        console.log(handshakeData);
        callback(null, true); // error first callback style 
      });
    });
    */
    io.configure(function () {
      io.set('transports', [ 'xhr-polling']);
    });
    io.sockets.on('connection', function (socket) {
        var session_id = socket.id;
        /* TODO
         * SETUP socket.once
         * that recieves the username/auth string
         * if valid, stores it with the socket.id
         */
        socket.once('message', function(data){
            data = JSON.parse(data);
            if (validateSession(data.auth, data.username)){
                //perform a create or get here!
                var protected_request = cartodb.api_url,
                    query = "SELECT neemo_ranks.user_rank, "+global.settings.user_table+".user_id, "+global.settings.user_table+".user_lvl, "+global.settings.user_table+".user_score, "+global.settings.user_table+".user_progress, "+global.settings.user_table+".track, "+global.settings.user_table+".region FROM " + 
                            "(SELECT row_number() OVER(ORDER BY user_score DESC) AS user_rank, user_score FROM "+global.settings.user_table+" GROUP BY user_score) " +
                            "AS neemo_ranks, "+global.settings.user_table+" WHERE "+global.settings.user_table+".user_score = neemo_ranks.user_score and user_id = '"+data.username+"' LIMIT 1;";
                //var query = "SELECT user_id, user_lvl, user_rank, user_score, user_progress, track, region FROM neemo_users WHERE user_id = '"+data.username+"' LIMIT 1;";
                var body = {q: query}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, result, response) {
                    //console.log('\n== CartoDB result for NEEMO get "' + query + '" ==');
                    //console.log(result + '\n');
                    var default_region = 0,
                        default_track = Math.floor(Math.random()*30);
                    result = JSON.parse(result);
                    if (result.total_rows == 0){
                        user_profile = {
                            user_id: data.username,
                            user_rank: 0,
                            user_lvl: 1,
                            user_pts: 1,
                            user_progress: 1,
                            track: default_track,
                            region: default_region,
                            user_latest: [
                                {points: 1, title: "welcome to neemo!"}
                            ],
                            new_user: true
                        };
                        socket.emit('user-metadata', user_profile);
                        var q2 = "INSERT INTO "+global.settings.user_table+" (user_id, user_lvl, user_score, user_progress, track, region) VALUES ('"+data.username+"', 1, 0, 1, "+default_track+", '"+default_region+"')";
                        var b2 = {q: q2};
                        cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, b2, null);
                    } else {
                        user_profile = {
                            user_id: result.rows[0].user_id,
                            user_rank: result.rows[0].user_rank,
                            user_lvl: result.rows[0].user_lvl,
                            user_pts: result.rows[0].user_score,
                            user_progress: result.rows[0].user_progress,
                            track: result.rows[0].track,
                            region: result.rows[0].region,
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
                var protected_request = cartodb.api_url,
                    query = "SELECT category, count(*) as count FROM "+global.settings.main_table+" WHERE downvotes < 1 AND region='"+data.region+"' GROUP BY category";
                socket.leave((data.region-1));
                socket.leave((data.region+1));
                socket.join(data.region);
                /* Send a CartoDB SQL request here
                 *
                 */
                //TODO: Create a view on CartoDB that gives updated summary stats for each region
                //placeholder
                    
                //var query = "SELECT user_id, user_lvl, user_rank, user_score, user_progress, track, region FROM neemo_users WHERE user_id = '"+data.username+"' LIMIT 1;";
                var body = {q: query}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, result, response) {
                    var annot = [];
                    result = JSON.parse(result);
                    for (i in result.rows){
                        annot.push({name: result.rows[i].category, total: result.rows[i].count});
                    }
                    socket.emit('region-metadata', {
                        region: data.region,
                        meters: (400 - (4*data.region)),
                        annotations: annot
                    });
                });
                
                query = "SELECT key, category, click_x, click_y, width, height, region, user_id, upvotes FROM "+global.settings.main_table+" WHERE downvotes < 1 and region = '"+data.region+"' ORDER BY created_at DESC LIMIT 25";
                var body = {q: query}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function(error, result, response) {
                    result = JSON.parse(result);
                    for (i in result.rows){
                
                        var out = { 
                            category: result.rows[i].category,
                            x: result.rows[i].click_x,
                            y: result.rows[i].click_y,
                            width: result.rows[i].width,
                            height: result.rows[i].height,
                            region: result.rows[i].region,
                            username: result.rows[i].user_id,
                            key: result.rows[i].key,
                            stored: true
                        }
                        socket.emit('region-new-data', out);
                    }
                });
                var q = "UPDATE "+global.settings.user_table+" SET user_progress="+data.progress+", region = '"+data.region+"' WHERE user_id = '"+data.username+"'";
                var b = {q: q}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, b, null, function(a,b,d){console.log(b)});
            
	    });
        socket.on('leave', function (data) {
            socket.leave('/'+data.region);
        });
	    socket.on('submit-vote', function (data) {
            if (validateSession(data.auth, data.username)){
                var protected_request = cartodb.api_url;
                if (data.type == 'upvote'){
                    var query = "UPDATE "+global.settings.main_table+" SET upvotes = upvotes + 1 WHERE key = '"+data.key+"' and user_id != '"+data.username+"'; " +
                                  "UPDATE "+global.settings.user_table+" SET user_score = user_score + 1 WHERE user_id = '"+data.username+"'; " +
                                  "UPDATE "+global.settings.user_table+" SET user_score = user_score + 2 WHERE user_id = '"+data.creator+"'; " +
                                  "INSERT INTO "+global.settings.activity_table+" (user_id, action, title, points, target_key) VALUES ('"+data.username+"', 'vote', 'upvote', 1, '"+data.key+"'); " ;
                } else if (data.type == 'downvote'){
                    var query = "UPDATE "+global.settings.main_table+" SET downvotes = downvotes + 1 WHERE key = '"+data.key+"' and user_id != '"+data.username+"'; " +
                                  "UPDATE "+global.settings.user_table+" SET user_score = user_score - 4 WHERE user_id = '"+data.username+"'; " +
                                  "UPDATE "+global.settings.user_table+" SET user_score = user_score - 6 WHERE user_id = '"+data.creator+"'; " +
                                  "INSERT INTO "+global.settings.activity_table+" (user_id, action, title, points, target_key) VALUES ('"+data.username+"', 'vote', 'downvote', -4, '"+data.key+"'); " +
                                  "INSERT INTO "+global.settings.activity_table+" (user_id, action, title, points, target_key) VALUES ('"+data.creator+"',  'dispute', 'invalid', -6, '"+data.key+"'); " ;
                }
                var body = {q: query}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function(a,b,c){console.log(b)});
            }
        });
	    socket.on('submit-data', function (data) {
            if (validateSession(data.auth, data.username)){
                //TODO create key from secret and username, store username in the object
                //then we can validate votes on annotations to ensure that votes aren't 
                //coming from the creator
                var key = [(new Date()).getTime(), socket.id].join('');
                var protected_request = cartodb.api_url;
                var query = "INSERT INTO "+global.settings.main_table+" (key, category, click_x, click_y, width, height, region, user_id, upvotes, downvotes) VALUES ('"+key+"','"+data.category+"',"+data.x+","+data.y+","+data.width+","+data.height+",'"+data.region+"','"+data.username+"', 1, 0)";
                var body = {q: query}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null);
                delete data['auth'];
                data.key = key;
                io.sockets.in(data.region).emit('region-new-data', data);
                
                var query = "INSERT INTO "+global.settings.activity_table+" (user_id, action, title, points, target_key) VALUES " +
                                "('"+data.username+"','annotation','"+data.category+"',3, '"+key+"'); "+
                            "UPDATE "+global.settings.user_table+" SET user_score = user_score + 3 WHERE user_id = '"+data.username+"'; ";
                var body = {q: query}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null);
            }
        });
    });
    
    require('./scoreboard').start(io, cartodb, store);
    //require('./worker').start(io, cartodb);
}
