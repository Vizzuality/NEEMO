#!/bin/sh
git pull
cd app
sudo killall node
sudo node app.js production
