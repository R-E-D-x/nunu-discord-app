@echo off
cd /d "C:\Bot\nunu-discord-app"

echo Checking for updates...
git fetch
git diff --quiet HEAD origin/main

IF %ERRORLEVEL% NEQ 0 (
    echo New changes found, pulling and restarting...

    REM Save current package.json hash
    for /f %%i in ('certutil -hashfile package.json SHA256 ^| find /i /v "SHA256"') do set OLD_HASH=%%i

    git pull

    REM Compare new hash
    for /f %%i in ('certutil -hashfile package.json SHA256 ^| find /i /v "SHA256"') do set NEW_HASH=%%i

    IF NOT "%OLD_HASH%"=="%NEW_HASH%" (
        echo package.json changed, running npm install...
        npm install
    ) ELSE (
        echo package.json didn’t change, skipping npm install.
    )

    echo Restarting the bot...
    pm2 restart discord-bot
) ELSE (
    echo No changes found.
)

pause
