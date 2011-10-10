#!/bin/sh
cd /home/ubunut/NEEMO 
git pull
cd app
sudo killall node > /dev/null
sudo node app.js production > app.log

