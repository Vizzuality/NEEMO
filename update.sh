#!/bin/sh
cd /home/ubuntu/NEEMO/
git pull
cd app
killall node
node app.js production
