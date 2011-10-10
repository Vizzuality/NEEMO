#!/bin/sh
cd '/home/ubuntu/NEEMO/'
`git pull`
cd /home/ubuntu/NEEMO/app
`killall node`
`node app.js production`
