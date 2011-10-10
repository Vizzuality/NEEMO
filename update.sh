#!/bin/sh
cd /home/ubuntu/NEEMO/
`git pull`
cd /home/ubuntu/NEEMO/app
`sudo killall node`
`sudo node app.js production`
