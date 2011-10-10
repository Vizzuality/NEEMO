#!/bin/sh
git pull
cd app
killall node
node app.js production
