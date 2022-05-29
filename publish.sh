#!/bin/bash
cd /home/zvava/zvava.org
echo '-> fetching latest updates'
git pull
echo '-> running generator script'
node make
echo '-> copying files'
cp -r out/gemini/* /var/gemini/content/
cp -r out/www/* /var/www/
echo '-> done!'
