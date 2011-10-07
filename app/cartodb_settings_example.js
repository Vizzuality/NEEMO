cartodb = {
    username          : 'username',
    password          : 'password',
    request_url       : 'https://username.cartodb.com/oauth/request_token',
    access_url        : 'https://username.cartodb.com/oauth/access_token',
    api_url           : 'https://username.cartodb.com/api/v1/sql',
    private_query     : 'SELECT ST_SRID(the_geom) FROM yourtable LIMIT 1',
    consumer_key      : 'your cartodb api key',
    consumer_secret   : 'your cartodb api secret',
    callback          : "http://yoururl/oauth/callback"
}
