@echo off
echo Starting Licitacoes Server...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed! Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Install requirements globally
echo Installing project requirements...
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo Failed to install requirements!
    pause
    exit /b 1
)

REM Check Ollama connection
echo Testing Ollama connection at 192.168.15.115...
powershell -Command "try { Invoke-WebRequest -Uri http://192.168.15.115:11434/api/version -Method GET -TimeoutSec 5 } catch { Write-Host 'Warning: Could not connect to Ollama server'; exit 0 }"
if errorlevel 1 (
    echo Warning: Could not connect to Ollama server at 192.168.15.115:11434
    echo Make sure Ollama is running on the specified server
    timeout /t 5
)

REM Start the server
echo Starting Flask server...
echo.
echo Access the application at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
python server.py
