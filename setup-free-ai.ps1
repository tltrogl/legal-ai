# Lexi AI - Quick Setup Script for Ollama (FREE)
# Run this to get started with 100% free local AI

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Lexi AI - FREE Setup with Ollama" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Ollama is installed
Write-Host "Checking for Ollama..." -ForegroundColor Yellow
try {
    $ollamaVersion = ollama --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Ollama is already installed!" -ForegroundColor Green
        Write-Host "  Version: $ollamaVersion" -ForegroundColor Gray
    }
}
catch {
    Write-Host "✗ Ollama not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Ollama:" -ForegroundColor Yellow
    Write-Host "  1. Visit: https://ollama.ai" -ForegroundColor White
    Write-Host "  2. Download for Windows" -ForegroundColor White
    Write-Host "  3. Install and come back here" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key to open Ollama website..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Start-Process "https://ollama.ai"
    exit 1
}

Write-Host ""

# Check if Ollama is running
Write-Host "Checking if Ollama is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434" -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "✓ Ollama is running!" -ForegroundColor Green
}
catch {
    Write-Host "✗ Ollama is not running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Starting Ollama..." -ForegroundColor Yellow
    Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 2
    Write-Host "✓ Ollama started!" -ForegroundColor Green
}

Write-Host ""

# Check for existing models
Write-Host "Checking for AI models..." -ForegroundColor Yellow
$models = ollama list 2>$null | Select-Object -Skip 1

if ($models) {
    Write-Host "✓ Found existing models:" -ForegroundColor Green
    ollama list
}
else {
    Write-Host "✗ No models found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Would you like to download llama3.1:8b? (Recommended)" -ForegroundColor Yellow
    Write-Host "  Size: ~4.7GB" -ForegroundColor Gray
    Write-Host "  Quality: Good for legal work" -ForegroundColor Gray
    Write-Host ""
    $download = Read-Host "Download now? (y/n)"
    
    if ($download -eq "y" -or $download -eq "Y") {
        Write-Host ""
        Write-Host "Downloading llama3.1:8b..." -ForegroundColor Yellow
        Write-Host "This may take a few minutes depending on your connection..." -ForegroundColor Gray
        ollama pull llama3.1:8b
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Model downloaded successfully!" -ForegroundColor Green
        }
        else {
            Write-Host "✗ Failed to download model" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host ""
        Write-Host "You can download a model later with:" -ForegroundColor Yellow
        Write-Host "  ollama pull llama3.1:8b" -ForegroundColor White
    }
}

Write-Host ""

# Test the model
Write-Host "Testing AI model..." -ForegroundColor Yellow
$testResponse = ollama run llama3.1:8b "Say 'working' if you can read this" --verbose=false 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ AI is working!" -ForegroundColor Green
    Write-Host "  Response: $testResponse" -ForegroundColor Gray
}
else {
    Write-Host "✗ AI test failed" -ForegroundColor Red
    Write-Host "  You may need to pull a model first: ollama pull llama3.1:8b" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. npm install" -ForegroundColor White
Write-Host "  2. npm run dev" -ForegroundColor White
Write-Host "  3. Open http://localhost:3000" -ForegroundColor White
Write-Host "  4. Go to Settings → AI Provider" -ForegroundColor White
Write-Host "  5. Select 'Ollama (Local)'" -ForegroundColor White
Write-Host "  6. Start using Lexi AI for FREE! 🎉" -ForegroundColor White
Write-Host ""
Write-Host "Optional models you can try:" -ForegroundColor Cyan
Write-Host "  ollama pull llama3.1:70b    # Better quality (needs 32GB RAM)" -ForegroundColor Gray
Write-Host "  ollama pull phi3:mini       # Smaller/faster (needs 4GB RAM)" -ForegroundColor Gray
Write-Host "  ollama pull llava:latest    # For image analysis" -ForegroundColor Gray
Write-Host ""
Write-Host "Need help? Check FREE_AI_SETUP.md" -ForegroundColor Cyan
Write-Host ""
