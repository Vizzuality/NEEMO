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


Compressing the javascripts
-------------
```
java -jar bin/compiler.jar \
--js app/public/js/libs/jquery-ui-1.8.16.custom.min.js \
--js app/public/js/libs/raphael-min.js \
--js app/public/js/libs/underscore-min.js \
--js app/public/js/libs/backbone-min.js \
--js app/public/js/libs/class.js \
--js app/public/js/libs/plugins.js \
--js app/public/js/Neemo.js \
--js app/public/js/Event.js \
--js app/public/js/Slideshow.js \
--js app/public/js/DataLayer.js \
--js app/public/js/Annotation.js \
--js app/public/js/UserProfile.js \
--js app/public/js/helpers.js \
--js app/public/js/spin.min.js \
--js app/public/regions/tracks.js \
--js app/public/js/Scoreboard.js \
--js_output_file app/public/js/all.js
```
