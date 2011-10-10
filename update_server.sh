#!/bin/sh
ssh -i ~/Dropbox/ec2-keys/id-vizzuality ubuntu@neemo.cartodb.com 'cd /home/ubuntu/NEEMO/ && git pull'
ssh -i ~/Dropbox/ec2-keys/id-vizzuality ubuntu@neemo.cartodb.com 'sudo cp -R /home/ubuntu/NEEMO/ /var/local/sites/'
ssh -i ~/Dropbox/ec2-keys/id-vizzuality ubuntu@neemo.cartodb.com 'sudo start neemo'