@echo off
title LiraUni Hostel System - Stopping...
color 0C

echo.
echo  Stopping LiraUni Hostel server...
echo.

:: Kill node processes running server.js
taskkill /F /FI "WINDOWTITLE eq LiraUni Hostel Server" >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

echo  Server stopped.
echo.
timeout /t 2 /nobreak >nul
exit
