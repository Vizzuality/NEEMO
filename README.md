NEEMO
==================

This is the Neemo web application server, client, and processing queue.

Look at app/cartodb_settings_example.js to see how we configure OAuth 
processing for the queue


Install
-------
```
git clone
npm install
node app.js
```

App.js features
-------------
* Serves a geospatial mapping application 
* Reads and maps existing annotations from CartoDB
* Provides sockets for clients to subscribe to geospatial areas
* Serves updates from the subscribed region to the client, real time annotations from other users
* Puts all annotations into a Redis queue

Queue.js features
-------------
* Reads the Redis queue 
* Uses the Simple SQL API to send annotations for storage on CartoDB


Run App Server
-------------

node app.js
(redis must be started)

Run Queue Server
-------------

node queue.js
(redis must be started)
