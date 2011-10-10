#!/bin/sh
ssh -i ~/Dropbox/ec2-keys/id-vizzuality ubuntu@neemo.cartodb.com 'cd /home/ubuntu/NEEMO && nohub update.sh &'