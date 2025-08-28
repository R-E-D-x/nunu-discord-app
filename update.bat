@echo off
cd /d "C:\Bot\nunu-discord-app"

echo Checking for updates...
git fetch --all
git reset --hard origin/main
