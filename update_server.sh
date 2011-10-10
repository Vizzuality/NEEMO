#!/bin/sh
ssh -i ~/Dropbox/ec2-keys/id-vizzuality ubuntu@neemo.cartodb.com 'cd /home/ubuntu/NEEMO/ && git pull'
ssh -i ~/Dropbox/ec2-keys/id-vizzuality ubuntu@neemo.cartodb.com 'cd /home/ubuntu/NEEMO/app/ && sudo killall node'
ssh -i ~/Dropbox/ec2-keys/id-vizzuality ubuntu@neemo.cartodb.com 'nohup sudo /usr/local/bin/node /home/ubuntu/NEEMO/app/app.js production 2>&1 >> /home/ubuntu/NEEMO/node.log &'