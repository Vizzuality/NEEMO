#!/bin/sh
clear
cd /home/ubuntu/NEEMO/
exec git pull
cd /home/ubuntu/NEEMO/app
exec sudo killall node
exec sudo -u ubuntu /usr/local/bin/node /home/ubuntu/NEEMO/app.js 2>&1 >> /var/log/node.log
sleep 1
exit




