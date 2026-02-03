# Quick MongoDB Installation Script
# Run this in PowerShell as Administrator

Write-Host "=== MongoDB Quick Installer for Raman Prints ===" -ForegroundColor Cyan
Write-Host ""

# Check if chocolatey is installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey (Package Manager)..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

Write-Host "Installing MongoDB..." -ForegroundColor Yellow
choco install mongodb -y

Write-Host ""
Write-Host "Creating MongoDB data directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "C:\data\db"

Write-Host ""
Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
net start MongoDB

Write-Host ""
Write-Host "=== Installation Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Close and reopen PowerShell" -ForegroundColor White
Write-Host "2. Navigate to your project: cd d:\PRINTOUT\raman_printer\printer" -ForegroundColor White
Write-Host "3. Start your app: npm run dev" -ForegroundColor White
Write-Host "4. Visit: http://localhost:3000" -ForegroundColor White
Write-Host ""
