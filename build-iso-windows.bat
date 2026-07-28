@echo off
REM
REM Copyright (c) IT Support BD https://itsupport.com.bd. All rights reserved.
REM This file is part of AMPOS.
REM
REM This program is not free software: you can not redistribute it and/or modify
REM it under the terms of the GNU Affero General Public License...
REM (Commercial licenses available at https://ampos.itsupport.com.bd/pricing)
REM

echo ============================================================
echo          AmPOS Windows ISO Builder (via Docker)
echo ============================================================
echo.

docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop is not installed or not running.
    echo Please install and start Docker Desktop for Windows, then run this script again.
    pause
    exit /b 1
)

echo [1/3] Building Docker ISO Builder image...
docker build -t ampos-iso-builder -f Dockerfile.isobuilder .
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build Docker image.
    pause
    exit /b 1
)

echo.
echo [2/3] Running ISO build container with privileged access...
docker run --rm --privileged -v "%cd%:/workspace" ampos-iso-builder
if %errorlevel% neq 0 (
    echo [ERROR] ISO build process failed inside container.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  ✅ SUCCESS! AmPOS Live ISO generated on your Windows host.
echo  File: %cd%\ampos-server-amd64.iso
echo ============================================================
echo.
pause
