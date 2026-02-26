@echo off
REM Shopizer React - Artifact Download and Deploy Script (Windows)
REM Usage: download-and-deploy.bat [BUILD_NUMBER] [ARTIFACT_TYPE]

setlocal enabledelayedexpansion

set "GITHUB_REPO=YOUR_GITHUB_USERNAME/shopizer-shop-reactjs"
set "BUILD_NUMBER=%~1"
set "ARTIFACT_TYPE=%~2"
set "DEPLOY_DIR=deployed"

if "%BUILD_NUMBER%"=="" set "BUILD_NUMBER=latest"
if "%ARTIFACT_TYPE%"=="" set "ARTIFACT_TYPE=build"

echo === Shopizer React Artifact Downloader ===
echo.

REM Check if GitHub CLI is installed
where gh >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: GitHub CLI is not installed
    echo Install it from: https://cli.github.com/
    exit /b 1
)

REM Check authentication
gh auth status >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Not authenticated with GitHub CLI
    echo Run: gh auth login
    exit /b 1
)

echo GitHub CLI authenticated
echo.

REM Get latest workflow run if BUILD_NUMBER is "latest"
if "%BUILD_NUMBER%"=="latest" (
    echo Fetching latest successful workflow run...
    for /f %%i in ('gh run list --repo %GITHUB_REPO% --workflow=ci-cd.yml --status=success --limit=1 --json number --jq ".[0].number"') do set BUILD_NUMBER=%%i
    echo Latest build number: !BUILD_NUMBER!
)

REM Find run ID
for /f %%i in ('gh run list --repo %GITHUB_REPO% --workflow=ci-cd.yml --limit=100 --json databaseId^,number --jq ".[] | select(.number==!BUILD_NUMBER!) | .databaseId"') do set RUN_ID=%%i

if "!RUN_ID!"=="" (
    echo Error: Build #!BUILD_NUMBER! not found
    exit /b 1
)

echo Found workflow run ID: !RUN_ID!
echo.

REM Determine artifact name
if "%ARTIFACT_TYPE%"=="build" set "ARTIFACT_NAME=shopizer-react-build-!BUILD_NUMBER!"
if "%ARTIFACT_TYPE%"=="release" set "ARTIFACT_NAME=shopizer-react-release-!BUILD_NUMBER!"
if "%ARTIFACT_TYPE%"=="docker" set "ARTIFACT_NAME=shopizer-react-docker-!BUILD_NUMBER!"
if "%ARTIFACT_TYPE%"=="coverage" set "ARTIFACT_NAME=test-coverage-!BUILD_NUMBER!"

echo Downloading artifact: !ARTIFACT_NAME!
echo.

REM Create deploy directory
if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"
cd "%DEPLOY_DIR%"

REM Download artifact
gh run download !RUN_ID! --repo %GITHUB_REPO% --name !ARTIFACT_NAME!

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Artifact downloaded successfully
    echo.
    
    if "%ARTIFACT_TYPE%"=="build" (
        echo Build artifacts ready in: %DEPLOY_DIR%\!ARTIFACT_NAME!
        echo.
        echo To serve the application:
        echo   cd %DEPLOY_DIR%\!ARTIFACT_NAME!
        echo   npx serve -s . -p 3000
    )
    
    if "%ARTIFACT_TYPE%"=="release" (
        echo Extracting release package...
        tar -xzf shopizer-react-!BUILD_NUMBER!.tar.gz
        del shopizer-react-!BUILD_NUMBER!.tar.gz
        echo Release extracted
        echo.
        echo To serve the application:
        echo   cd %DEPLOY_DIR%
        echo   npx serve -s . -p 3000
    )
    
    if "%ARTIFACT_TYPE%"=="docker" (
        echo Loading Docker image...
        docker load -i shopizer-react-docker-!BUILD_NUMBER!.tar.gz
        echo Docker image loaded
        echo.
        echo To run the container:
        echo   docker run -p 80:80 shopizer-shop-reactjs:!BUILD_NUMBER!
    )
    
    if "%ARTIFACT_TYPE%"=="coverage" (
        echo Test coverage reports ready in: %DEPLOY_DIR%\!ARTIFACT_NAME!
        echo.
        echo To view coverage report:
        echo   start %DEPLOY_DIR%\!ARTIFACT_NAME!\lcov-report\index.html
    )
) else (
    echo Error: Failed to download artifact
    exit /b 1
)

echo.
echo === Deployment Complete ===
