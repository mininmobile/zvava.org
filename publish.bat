@echo off
echo -> running remote publish.sh
ssh zvava@zvava.org '/home/zvava/zvava.org/publish.sh' > sshlog.txt
type sshlog.txt
