@echo off
title LiraUni Hostel System - Starting...
color 0A

echo.
echo  ============================================
echo   LiraUni Hostel Booking System
echo  ============================================
echo.

:: ── Check if Node.js is installed ─────────────────────────
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is not installed!
    echo  Please download it from https://nodejs.org
    echo.
    pause
    exit /b
)

:: ── Check if server folder exists ─────────────────────────
if not exist "%~dp0server\server.js" (
    echo  [ERROR] server\server.js not found!
    echo  Make sure you run this from the project folder.
    echo.
    pause
    exit /b
)

:: ── Check if node_modules exists, install if not ──────────
if not exist "%~dp0server\node_modules" (
    echo  Installing dependencies for the first time...
    echo  This only happens once. Please wait...
    echo.
    cd /d "%~dp0server"
    npm install
    cd /d "%~dp0"
    echo.
    echo  Dependencies installed!
    echo.
)

:: ── Ensure MySQL is running ────────────────────────────────
echo  Checking MySQL...

:: Try starting MySQL80 (MySQL 8.0 service name)
net start MySQL80 >nul 2>&1

:: Try starting MySQL (older versions)
net start MySQL >nul 2>&1

:: Check if MySQL is now listening on port 3306
netstat -ano | findstr ":3306" >nul 2>&1
if %errorlevel% equ 0 (
    echo  MySQL is running on port 3306.
    goto :start_server
)

:: MySQL not found - show instructions
echo.
echo  [WARNING] MySQL is not running!
echo.
echo  Please start MySQL first:
echo    Option 1: Open XAMPP Control Panel, click Start next to MySQL
echo    Option 2: Press Win+R, type services.msc, find MySQL and Start it
echo.
echo  After starting MySQL, press any key to continue...
pause >nul

:: Check again after user action
netstat -ano | findstr ":3306" >nul 2>&1
if %errorlevel% neq 0 (
    echo  MySQL still not detected. Starting server anyway...
    echo  You may see database errors until MySQL is running.
    echo.
)

:start_server
:: ── Start the Node.js server in a new window ──────────────
echo.
echo  Starting LiraUni Hostel server...
start "LiraUni Hostel Server" cmd /k "cd /d "%~dp0server" && node server.js"

:: ── Wait for server to start ──────────────────────────────
echo  Waiting for server to be ready...
timeout /t 3 /nobreak >nul

:: ── Open browser ──────────────────────────────────────────
echo  Opening browser...
start "" "http://localhost:5000/host.html"

echo.
echo  ============================================
echo   System is running!
echo   URL: http://localhost:5000/host.html
echo.
echo   To STOP: close the "LiraUni Hostel Server"
echo   window or double-click STOP.bat
echo  ============================================
echo.
timeout /t 4 /nobreak >nul
exit
