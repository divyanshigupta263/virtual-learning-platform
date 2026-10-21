@echo off
title Virtual Learning Platform - Server
color 0A
echo ===================================================================
echo     STARTING VIRTUAL LEARNING PLATFORM (AI & ASSESSMENT SUITE)
echo ===================================================================
echo.
echo [1/2] Launching backend server on port 5000...
cd /d "%~dp0server"

echo [2/2] Opening your dashboard in browser...
timeout /t 2 /nobreak >nul
start "" http://localhost:5000

echo.
echo ===================================================================
echo  * Server is ACTIVE on http://localhost:5000
echo  * You can also use VS Code Live Server on port 5500 simultaneously!
echo  * Keep this window open while using the platform.
echo ===================================================================
echo.

node index.js
pause
