#!/bin/sh
LIVE=racknerd-c36864
if [ "$(hostname)" != $LIVE ]; then
	ssh zvava@zvava.org "bash /home/zvava/zvava.org/publish.sh"
else
	cd /home/zvava/zvava.org
	echo '-> fetching latest updates'
	git fetch --all
	git reset --hard origin/qjs
	git pull
	chmod +x publish.sh
	echo '-> running generator script'
	/usr/local/bin/qjs ./make.js
	echo '-> copying files'
	cp -r out/gemini/* /var/gemini/content/
	cp -r out/www/* /var/www/
	echo '-> done!'
fi
