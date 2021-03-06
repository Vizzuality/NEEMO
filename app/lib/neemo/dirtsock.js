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
        if (newhash==hash){
            return true;
        }else{
            return false;
        }
    }
    io.configure(function () {
      io.set('transports', ['xhr-polling']);
      io.set('heartbeat timeout', 5);
      io.set('heartbeat interval', 3);
      io.set('log level', 1);
    });
    io.sockets.on('connection', function (socket) {
        var session_id = socket.id;
        socket.once('message', function(data){
            data = JSON.parse(data);
            if (validateSession(data.auth, data.username)){
                //perform a create or get here!
                var protected_request = cartodb.api_url,
                    query = "SELECT neemo_ranks.user_rank, "+global.settings.user_table+".user_id, "+global.settings.user_table+".user_lvl, "+global.settings.user_table+".user_score, "+global.settings.user_table+".user_progress, "+global.settings.user_table+".track, "+global.settings.user_table+".region, activity.activity FROM " + 
                            "(SELECT (SELECT ARRAY(SELECT action||':'||category||':'||points FROM "+global.settings.activity_table+" WHERE user_id = '"+data.username+"' ORDER BY create_time DESC LIMIT 5)) as activity FROM "+global.settings.main_table+") AS activity, " +
                            "(SELECT row_number() OVER(ORDER BY user_score DESC) AS user_rank, user_score FROM "+global.settings.user_table+" GROUP BY user_score) " +
                            "AS neemo_ranks, "+global.settings.user_table+" WHERE "+global.settings.user_table+".user_score = neemo_ranks.user_score and user_id = '"+data.username+"' LIMIT 1;";
                var body = {q: query}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, result, response) {
                    if (error){
                        socket.emit('disconnect');
                    } else {
                        var default_region = 0,
                            default_track = Math.floor(Math.random()*26);
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
                            var q2 = "INSERT INTO "+global.settings.user_table+" (user_id, user_lvl, user_score, user_progress, track, region, start_track) VALUES ('"+data.username+"', 1, 0, 1, "+default_track+", '"+default_region+"', "+default_track+"); ";
                            var b2 = {q: q2};
                            cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, b2, null);
                        } else {
                            var latest = [];
                            var t = result.rows[0].activity.length;
                            while (t > 0){
                                t--;
                                var a = result.rows[0].activity[t].split(':');
                                var an = {};
                                if (a[0]=='annotation'){
                                    an = {points: a[2], title: "you have found a new "+a[1]+" occurrence"};
                                } else if (a[0]=='vote'){
                                    if (a[2] < 0){
                                        an = {points: a[2], title: "you gave an annotation a downvote."};
                                    } else {
                                        an = {points: a[2], title: "you gave an annotation an upvote!"};
                                    }
                                } else if (a[0]=='confirm'){
                                    an = {points: a[2], title: "your annotation recieved an upvote!"};
                                } else if (a[0]=='disputed'){
                                    an = {points: a[2], title: "your annotation recieved a downvote."};
                                }
                                latest.push(an)
                            
                            }
                            //{points: 0, title: "welcome back to neemo!"}
                            user_profile = {
                                user_id: result.rows[0].user_id,
                                user_rank: result.rows[0].user_rank,
                                user_lvl: result.rows[0].user_lvl,
                                user_pts: result.rows[0].user_score,
                                user_progress: result.rows[0].user_progress,
                                track: result.rows[0].track,
                                region: result.rows[0].region,
                                user_latest: latest
                            }
                            socket.emit('user-metadata', user_profile);
                        }
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
                        //meters: (400 - (4*data.region)),
                        annotations: annot
                    });
                });
                
                query = "SELECT key, category, click_x, click_y, width, height, region, user_id, upvotes FROM "+global.settings.main_table+" WHERE downvotes < 1 and region = '"+data.region+"' ORDER BY create_time DESC LIMIT 25";
                //console.log(query);
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
                var q = "SELECT user_score as top_score FROM "+global.settings.user_table+" ORDER BY user_score DESC LIMIT 1; ";
                var b = {q: q}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, b, null, function(a,data,d){
                    data = JSON.parse(data);
                    socket.emit('top-score', data.rows[0].top_score);
                });
                
                var q = "UPDATE "+global.settings.user_table+" SET track="+data.track+", region = '"+data.region+"' WHERE user_id = '"+data.username+"'";
                var b = {q: q}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, b, null);
            
	    });
        socket.on('leave', function (data) {
            socket.leave('/'+data.region);
        });
	    socket.on('submit-vote', function (data) {
            if (validateSession(data.auth, data.username)){
                var protected_request = cartodb.api_url;
                if (data.type == 'upvote'){  //update neemo_activity set create_time= timestamp 'now';
                    var query = "UPDATE "+global.settings.main_table+" SET upvotes = upvotes + 1 WHERE key = '"+data.key+"' and user_id != '"+data.username+"'; " +
                                  "UPDATE "+global.settings.user_table+" SET user_score = user_score + 1 WHERE user_id = '"+data.username+"'; " +
                                  "UPDATE "+global.settings.user_table+" SET user_score = user_score + 2 WHERE user_id = '"+data.creator+"'; " +
                                  "INSERT INTO "+global.settings.activity_table+" (user_id, action, title, points, target_key, create_time) VALUES ('"+data.creator+"', 'confirm', 'valid', 1, '"+data.key+"', timestamp 'now'); " +
                                  "INSERT INTO "+global.settings.activity_table+" (user_id, action, title, points, target_key, create_time) VALUES ('"+data.username+"', 'vote', 'upvote', 1, '"+data.key+"', timestamp 'now'); " ;
                } else if (data.type == 'downvote'){
                    var query = "UPDATE "+global.settings.main_table+" SET downvotes = downvotes + 1 WHERE key = '"+data.key+"' and user_id != '"+data.username+"'; " +
                                  "UPDATE "+global.settings.user_table+" SET user_score = user_score - 4 WHERE user_id = '"+data.username+"'; " +
                                  "UPDATE "+global.settings.user_table+" SET user_score = user_score - 6 WHERE user_id = '"+data.creator+"'; " +
                                  "INSERT INTO "+global.settings.activity_table+" (user_id, action, title, points, target_key, create_time) VALUES ('"+data.username+"', 'vote', 'downvote', -4, '"+data.key+"', timestamp 'now'); " +
                                  "INSERT INTO "+global.settings.activity_table+" (user_id, action, title, points, target_key, create_time) VALUES ('"+data.creator+"',  'dispute', 'invalid', -6, '"+data.key+"', timestamp 'now'); " ;
                }
                var body = {q: query}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null);
            }
        });
	    socket.on('submit-data', function (data) {
            if (validateSession(data.auth, data.username)){
                //TODO create key from secret and username, store username in the object
                //then we can validate votes on annotations to ensure that votes aren't 
                //coming from the creator
                var key = [(new Date()).getTime(), socket.id].join('');
                var protected_request = cartodb.api_url;
                var query = "INSERT INTO "+global.settings.main_table+" (key, category, click_x, click_y, width, height, region, user_id, upvotes, downvotes, create_time) VALUES ('"+key+"','"+data.category+"',"+data.x+","+data.y+","+data.width+","+data.height+",'"+data.region+"','"+data.username+"', 1, 0, timestamp 'now')";
                var body = {q: query}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null);
                delete data['auth'];
                data.key = key;
                io.sockets.in(data.region).emit('region-new-data', data);
                
                var query = "INSERT INTO "+global.settings.activity_table+" (user_id, action, title, points, target_key, create_time) VALUES " +
                                "('"+data.username+"','annotation','"+data.category+"',3, '"+key+"', timestamp 'now'); "+
                            "UPDATE "+global.settings.user_table+" SET user_score = user_score + 3 WHERE user_id = '"+data.username+"'; ";
                var body = {q: query}
                cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null);
            }
        });
    });
    
    require('./scoreboard').start(io, cartodb, store);
    //require('./worker').start(io, cartodb);
}
