var assert      = require('assert');
var tests       = module.exports = {};
var _           = require('underscore');
var querystring = require('querystring');
require(__dirname + '/../test_helper');

var Windshaft = require(__dirname + '/../../lib/windshaft');
var serverOptions = require(__dirname + '/../../lib/cartodb/server_options');
var server = new Windshaft.Server(serverOptions);

tests['true'] = function() {
    assert.ok(true);
};

tests["get call to server returns 200"] = function(){
    assert.response(server, {
        url: '/',
        method: 'GET'
    },{
        status: 200
    });
};

tests["get'ing blank style returns default style"] = function(){
    assert.response(server, {
        headers: {host: 'vizzuality.localhost.lan'},
        url: '/tiles/my_table/style',
        method: 'GET'
    },{
        status: 200,
        body: '{"style":"#my_table {marker-fill: #FF6600;marker-opacity: 1;marker-width: 8;marker-line-color: white;marker-line-width: 3;marker-line-opacity: 0.9;marker-placement: point;marker-type: ellipse;marker-allow-overlap: true;}"}'
    });
};



tests["post'ing no style returns 400 with errors"] = function(){
    assert.response(server, {
        headers: {host: 'vizzuality.localhost.lan'},
        url: '/tiles/my_table/style',
        method: 'POST'
    },{
        status: 400,
        body: '{"error":"must sent style information"}'
    });
};



tests["post'ing bad style returns 400 with error"] = function(){
    assert.response(server, {
        url: '/tiles/my_table3/style',
        method: 'POST',
        headers: {host: 'vizzuality.localhost.lan', 'Content-Type': 'application/x-www-form-urlencoded' },
        data: querystring.stringify({style: '#my_table3{backgxxxxxround-color:#fff;}'})
    },{
        status: 400,
        body: JSON.stringify(['style.mss:1:11 Unrecognized rule: backgxxxxxround-color'])
    });
};



tests["post'ing multiple bad styles returns 400 with error array"] = function(){
    assert.response(server, {
        url: '/tiles/my_table4/style',
        method: 'POST',
        headers: {host: 'vizzuality.localhost.lan', 'Content-Type': 'application/x-www-form-urlencoded' },
        data: querystring.stringify({style: '#my_table4{backgxxxxxround-color:#fff;foo:bar}'})
    },{
        status: 400,
        body: JSON.stringify([ 'style.mss:1:11 Unrecognized rule: backgxxxxxround-color', 'style.mss:1:38 Unrecognized rule: foo' ])
    });
};



tests["post'ing good style returns 200"] = function(){
    assert.response(server, {
        url: '/tiles/my_table5/style',
        method: 'POST',
        headers: {host: 'vizzuality.localhost.lan', 'Content-Type': 'application/x-www-form-urlencoded' },
        data: querystring.stringify({style: '#my_table5{background-color:#fff;}'})
    },{
        status: 200
    });
};




tests["post'ing good style returns 200 then getting returns original style"] = function(){
    var style = '#my_table5{background-color:#fff;}';
    assert.response(server, {
        url: '/tiles/my_table5/style',
        method: 'POST',
        headers: {host: 'vizzuality.localhost.lan', 'Content-Type': 'application/x-www-form-urlencoded' },
        data: querystring.stringify({style: style})
    },{
        status: 200
    });


    assert.response(server, {
        headers: {host: 'vizzuality.localhost.lan'},
        url: '/tiles/my_table5/style',
        method: 'GET'
    },{
        status: 200,
        body: JSON.stringify({style: style})
    });
};


tests["get'ing blank infowindow returns blank"] = function(){
    assert.response(server, {
        headers: {host: 'vizzuality.localhost.lan'},
        url: '/tiles/my_tablez/infowindow',
        method: 'GET'
    },{
        status: 200,
        body: '{"infowindow":null}'
    });
};

tests["get'ing blank infowindow with callback returns blank with callback"] = function(){
    assert.response(server, {
        headers: {host: 'vizzuality.localhost.lan'},
        url: '/tiles/my_tablez/infowindow?callback=simon',
        method: 'GET'
    },{
        status: 200,
        body: 'simon({"infowindow":null});'
    });
};


// note requires:
// SELECT 0
// HSET rails:cartodb_user_123_db:my_table infowindow "this, that, the other"
tests["get'ing completed infowindow with callback returns information with callback"] = function(){
    assert.response(server, {
        headers: {host: 'vizzuality.localhost.lan'},
        url: '/tiles/my_table/infowindow?callback=simon',
        method: 'GET'
    },{
        status: 200,
        body: 'simon({"infowindow":"this, that, the other"});'
    });
};



tests["get'ing a tile with default style should return an image"] = function(){
    assert.response(server, {
        headers: {host: 'vizzuality.localhost.lan'},
        url: '/tiles/gadm4/6/31/24.png?geom_type=polygon',
        method: 'GET'
    },{
        status: 200,
        headers: { 'Content-Type': 'image/png' }
    });
};

tests["get'ing a json with default style should return an grid"] = function(){
    assert.response(server, {
        headers: {host: 'vizzuality.localhost.lan'},
        url: '/tiles/gadm4/6/31/24.grid.json',
        method: 'GET'
    },{
        status: 200,
        headers: { 'Content-Type': 'text/javascript; charset=utf-8; charset=utf-8' }
    });
};


tests["get'ing a json with default style and sql should return a constrained grid"] = function(){
    var sql = querystring.stringify({sql: "SELECT * FROM gadm4 WHERE name_2 = 'Murcia'"})
    assert.response(server, {
        headers: {host: 'vizzuality.localhost.lan'},
        url: '/tiles/gadm4/6/31/24.grid.json?' + sql,
        method: 'GET'
    },{
        status: 200,
        headers: { 'Content-Type': 'text/javascript; charset=utf-8; charset=utf-8' }
    });
};



tests["get'ing a tile with default style and sql should return a constrained image"] = function(){
    var sql = querystring.stringify({sql: "SELECT * FROM gadm4 WHERE name_2 = 'Murcia'"});
    assert.response(server, {
        headers: {host: 'vizzuality.localhost.lan'},
        url: '/tiles/gadm4/6/31/24.png?' + sql,
        method: 'GET'
    },{
        status: 200,
        headers: { 'Content-Type': 'image/png' }
    });
};


tests["get'ing a tile with default style and complex sql should return a constrained image"] = function(){
    var sql = querystring.stringify({sql: "SELECT * FROM gadm4 WHERE name_2 = 'Murcia' AND id_1 > 950"})
    assert.response(server, {
        headers: {host: 'vizzuality.localhost.lan'},
        url: '/tiles/gadm4/6/31/24.png?' + sql,
        method: 'GET'
    },{
        status: 200,
        headers: { 'Content-Type': 'image/png' }
    });
};