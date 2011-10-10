#!/bin/sh
ssh -i ~/Dropbox/ec2-keys/id-vizzuality ubuntu@neemo.cartodb.com 'nohup sh /home/ubuntu/NEEMO/update.sh &'