// 0. if hostname !== "BABA" and git is dirty, then exit and tell me to commit changes
// A. if not running on hostname "BABA", execute `ssh zvava@zvava.org -c node ~/zvava.org/publish` then exit
// B. if running on hostname "BABA"
// 1. cd ~/zvava.org
// 2. git pull
// 3. node make
// 4. cp /out/www/* /var/www/*
// 5. cp /out/gemini/* /var/gemini/content/*
