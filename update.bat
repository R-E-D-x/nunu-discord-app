@echo off
cd /d "C:\Users\cubyv\OneDrive\Desktop\Stuff\Discord app"

git fetch
git diff --quiet HEAD origin/main

IF %ERRORLEVEL% NEQ 0 (
    echo New changes found, pulling and restarting...
    git pull
    pm2 restart discord-bot
) ELSE (
    echo No changes.
)
