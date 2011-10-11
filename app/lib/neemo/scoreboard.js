var   Step        = require('step')
    , _           = require('underscore')
    , redis       = require('redis-client')
    , usub        = redis.createClient();
    
// Sets up the socket server for the scoreboard
exports.start = function(io, cartodb, store) {
    /* Setup Scoreboard connections and functions
     */

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
                query = "SELECT neemo_ranks.user_rank, neemo_users.user_id, neemo_users.user_lvl, neemo_users.user_score, neemo_users.user_progress FROM " + 
                         "(SELECT row_number() OVER(ORDER BY user_score DESC) AS user_rank, user_score FROM neemo_users GROUP BY user_score) " +
                         "as neemo_ranks, neemo_users WHERE neemo_users.user_score = neemo_ranks.user_score and user_id = '"+data.username+"' LIMIT 1;",
                body = {q: query};
                
            cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, data, response) {
                data = JSON.parse(data);
                socket.emit('user-ranking', {
                    user_id: data.rows[0].user_id,
                    user_rank: data.rows[0].user_rank,
                    user_lvl: data.rows[0].user_lvl
                });
            });
        });
        socket.on('join', function (data) {
            var pageSize = 500,
                protected_request = cartodb.api_url,
                offset = pageSize * (data.page - 1),
                query = "SELECT neemo_ranks.user_rank, neemo_users.user_id, neemo_users.user_lvl, neemo_users.user_score, neemo_users.user_progress FROM " + 
                         "(SELECT row_number() OVER(ORDER BY user_score DESC) AS user_rank, user_score FROM neemo_users GROUP BY user_score) " +
                         "as neemo_ranks, neemo_users WHERE neemo_users.user_score = neemo_ranks.user_score " +
                         "ORDER BY neemo_ranks.user_rank ASC LIMIT "+pageSize+" OFFSET "+offset+";",
                body = {q: query};
            
            socket.join("scoreboard-"+data.page);
            
            
            cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, data, response) {
                data = JSON.parse(data);
                socket.emit('scoreboard-update', data);
            });
            
            
        });
        socket.on('leave', function (data) {
            socket.leave("scoreboard-" + data.page);
        });
    });
    
    /* send live ranking updates to scoreboard viewers based on page */
    usub.stream.addListener('connect', function(){
        usub.subscribeTo("scoreboard-update", 
            function (channel, data) {
                data = JSON.parse(data);
                io.of('/scoreboard').in("scoreboard-"+data.page).emit('scoreboard-update', data);
            }
        );
    });
}
