var   Step        = require('step')
    , _           = require('underscore')
    , redis       = require('redis-client')
    , usub        = redis.createClient();
    
// Sets up the socket server for the scoreboard
exports.start = function(io, cartodb, store) {
    /* Setup Scoreboard connections and functions
     */
    var pageSize = 50;
                
    function handleRankings() {
        var protected_request = cartodb.api_url;
        var offset = pageSize * (page - 1)
        var query = "SELECT user_id, user_rank, user_lvl, user_score, user_progress FROM neemo_scores LIMIT "+pageSize+" OFFSET "+offset+";";
        var body = {q: query}
        cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, data, response) {
            data = JSON.parse(data);
            
            var output = {
                total_rows: data.total_rows,
                page: page,
                limit: pageSize,
                ranks: {}
            };
            for (i in data.rows){
                var u = {
                    user_id: data.rows[i].user_id,
                    user_rank: data.rows[i].user_rank,
                    user_lvl: data.rows[i].user_lvl,
                    user_lvl: data.rows[i].user_score
                }
                output.ranks[data.rows[i].poll] = u;
            }
        });
    }
    
    io.of('/scoreboard').on('connection', function (socket) {
        socket.once('message', function(data) {
            //TODO validate data.auth now
            /* Send the user their detailed ranking info 
             * { user_id: 'andrewxhill', user_rank: 1, user_lvl: 11 },
             */
            var protected_request = cartodb.api_url,
                data = JSON.parse(data),
                query = "SELECT neemo_ranks.user_rank, "+global.settings.user_table+".user_id, "+global.settings.user_table+".user_lvl, "+global.settings.user_table+".user_score, "+global.settings.user_table+".user_progress FROM " + 
                         "(SELECT row_number() OVER(ORDER BY user_score DESC) AS user_rank, user_score FROM "+global.settings.user_table+" GROUP BY user_score) " +
                         "as neemo_ranks, "+global.settings.user_table+" WHERE "+global.settings.user_table+".user_score = neemo_ranks.user_score and user_id = '"+data.username+"' LIMIT 1;",
                body = {q: query};
                
            cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, data, response) {
                if (error){
                    socket.emit('user-ranking', {
                        user_id: null,
                        user_rank: null,
                        user_lvl: null
                    });
                    
                }else{
                    data = JSON.parse(data);
                    if (data.rows.length > 0){
                        socket.emit('user-ranking', {
                            user_id: data.rows[0].user_id,
                            user_rank: data.rows[0].user_rank,
                            user_lvl: data.rows[0].user_lvl
                        });
                        q = "SELECT count(*) as count FROM (SELECT row_number() OVER(ORDER BY user_score DESC) " +
                            "AS user_rank, user_score FROM "+global.settings.user_table+" GROUP BY user_score) " +
                            "as neemo_ranks, "+global.settings.user_table+" " +
                            "WHERE "+global.settings.user_table+".user_score = neemo_ranks.user_score " +
                            "AND neemo_ranks.user_rank < " + data.rows[0].user_rank + "; ";
                        b = {q: q};
                        cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, b, null, function (e, d, r) {
                            if (e){
                                //error
                            }else{
                                d = JSON.parse(d);
                                if (d.rows[0].count + 1 > pageSize){
                                    socket.emit('user-page', Math.floor(d.rows[0].count/pageSize) + 1 );
                                }
                            }
                        });
                    } else {
                    
                        socket.emit('user-ranking', {
                            user_id: null,
                            user_rank: null,
                            user_lvl: null
                        });
                    }
                }
            });
        });
        socket.on('join', function (data) {
            var protected_request = cartodb.api_url,
                offset = pageSize * (data.page - 1),
                query = "SELECT neemo_ranks.user_rank, "+global.settings.user_table+".user_id, "+global.settings.user_table+".user_lvl, "+global.settings.user_table+".user_score, (100*"+global.settings.user_table+".user_score / top.top_score) as user_progress FROM " + 
                         "(SELECT user_score as top_score FROM "+global.settings.user_table+" ORDER BY user_score DESC LIMIT 1) as top, " + 
                         "(SELECT row_number() OVER(ORDER BY user_score DESC) AS user_rank, user_score FROM "+global.settings.user_table+" GROUP BY user_score) " +
                         "as neemo_ranks, "+global.settings.user_table+" WHERE "+global.settings.user_table+".user_score = neemo_ranks.user_score and neemo_ranks.user_score > 0 " +
                         "ORDER BY neemo_ranks.user_rank ASC LIMIT "+pageSize+" OFFSET "+offset+";",
                body = {q: query};
            
            socket.join("scoreboard-"+data.page);
            
            
            cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, data, response) {
                if (error){
                    //error
                } else {
                    data = JSON.parse(data);
                    socket.emit('scoreboard-update', data);
                }
            });
            
            var q = "SELECT user_score as top_score FROM "+global.settings.user_table+" ORDER BY user_score DESC LIMIT 1; ";
            var b = {q: q}
            cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, b, null, function(a,data,d){
                data = JSON.parse(data);
                socket.emit('top-score', data.rows[0].top_score);
            });
            
        });
        socket.on('leave', function (data) {
            socket.leave("scoreboard-" + data.page);
        });
    });
    
    /* send live ranking updates to scoreboard viewers based on page */
    /*
    usub.stream.addListener('connect', function(){
        usub.subscribeTo("scoreboard-update", 
            function (channel, data) {
                data = JSON.parse(data);
                io.of('/scoreboard').in("scoreboard-"+data.page).emit('scoreboard-update', data);
            }
        );
    });
    */
}
