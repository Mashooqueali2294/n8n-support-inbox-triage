@echo off
echo ================================================
echo  Support Inbox Triage - Auto Setup
echo  by Mashooque ^| Purple Merit Assessment
echo ================================================
echo.

REM Step 1: Check .env
if not exist .env (
    echo [1/5] Creating .env from template...
    copy .env.example .env
    echo.
    echo !! IMPORTANT: Open .env file and fill in:
    echo    - GOOGLE_SHEET_ID
    echo    - NOTIFY_EMAIL
    echo.
    echo After filling .env, run start.bat again.
    pause
    start notepad .env
    exit /b
)

echo [1/5] .env found OK

REM Step 2: Start containers
echo [2/5] Starting n8n Docker container...
docker compose down >nul 2>&1
docker compose up -d
if errorlevel 1 (
    echo ERROR: Docker failed. Make sure Docker Desktop is running!
    pause
    exit /b
)

REM Step 3: Wait for n8n to be ready
echo [3/5] Waiting for n8n to start (15 seconds)...
timeout /t 15 /nobreak >nul

REM Step 4: Install custom node inside container
echo [4/5] Installing TicketClassifierNode inside container...
docker exec --user root n8n_support_triage sh -c "mkdir -p /home/node/.n8n/nodes/node_modules/n8n-nodes-ticket-classifier && cp -r /opt/custom-node/. /home/node/.n8n/nodes/node_modules/n8n-nodes-ticket-classifier/ && chown -R node:node /home/node/.n8n/nodes"

REM Step 5: Restart so n8n loads the node
echo [5/5] Restarting n8n to load custom node...
docker restart n8n_support_triage
timeout /t 8 /nobreak >nul

echo.
echo ================================================
echo  DONE! n8n is running at: http://localhost:5678
echo ================================================
echo.
echo Next steps:
echo  1. Open http://localhost:5678
echo  2. Add Google Sheets OAuth2 credential
echo  3. Add Gmail OAuth2 credential  
echo  4. Import workflows from /workflows folder
echo  5. Activate both workflows
echo  6. Run: samples\test.bat to test!
echo.
pause
