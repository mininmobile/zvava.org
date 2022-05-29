#!/bin/bash
cd /home/zvava/zvava.org
echo '-> fetching latest updates'
git pull
echo '-> running generator script'
/opt/node-v16.15.0-linux-x64/bin/node make
echo '-> copying files'
cp -r out/gemini/* /var/gemini/content/
cp -r out/www/* /var/www/
echo '-> done!'
