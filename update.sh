#!/bin/sh
cd /home/ubuntu/NEEMO/
git pull
cd /home/ubuntu/NEEMO/app
sudo killall node > /dev/null
nohup sudo node app.js production &

cd /home/ubuntu/NEEMO/


