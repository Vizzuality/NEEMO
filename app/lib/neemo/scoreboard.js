var   Step        = require('step')
    , _           = require('underscore')
    , redis       = require('redis-client')
    , usub        = redis.createClient();
    
// Sets up the socket server for the scoreboard
exports.start = function(io, cartodb) {
    /* Setup Scoreboard connections and functions
     */

    function handleRankings() {
        var protected_request = cartodb.api_url;
        var offset = pageSize * (page - 1)
        var query = "SELECT user_id, user_rank, user_lvl, poll FROM neemo_scores LIMIT "+pageSize+" OFFSET "+offset+";";
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
                    user_lvl: data.rows[i].user_lvl
                }
                output.ranks[data.rows[i].poll] = u;
            }
        });
    }
    
    io.of('/scoreboard').on('connection', function (socket) {
        socket.on('join', function (data) {
            var pageSize = 15,
                protected_request = cartodb.api_url,
                offset = pageSize * (data.page - 1),
                query = "SELECT user_id, user_rank, user_lvl FROM neemo_scores ORDER BY user_rank ASC LIMIT "+pageSize+" OFFSET "+offset+";",
                body = {q: query};
            
            socket.join("scoreboard-"+data.page);
            
            
            cartodb.oa.post(protected_request, cartodb.access_key, cartodb.access_secret, body, null, function (error, data, response) {
                data = JSON.parse(data);
                socket.emit('scoreboard-update', data);
            });
            /* Send the user their detailed ranking info 
             * { user_id: 'andrewxhill', user_rank: 1, user_lvl: 11 },
             */
            socket.emit('user-ranking', {
                user_id: 'andrewxhill',
                user_rank: 1,
                user_lvl: 11
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
