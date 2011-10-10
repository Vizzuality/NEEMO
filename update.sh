#!/bin/sh
cd /home/ubuntu/NEEMO/
exec git pull
cd /home/ubuntu/NEEMO/app
exec sudo killall node
exec sudo node app.js production > app.log


