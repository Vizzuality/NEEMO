#!/bin/sh
cd /home/ubuntu/NEEMO/
exec git pull
cd /home/ubuntu/NEEMO/app
exec sudo killall node > /dev/null 2>&1 
exec sudo node app.js production 
cd /home/ubuntu/NEEMO/


