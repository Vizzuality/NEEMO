#!/bin/sh
ssh -i ~/Dropbox/ec2-keys/id-vizzuality ubuntu@neemo.cartodb.com 'cd NEEMO && git pull && cd app && sudo killall node > /dev/null && nohup sudo node app.js production > app.log &'