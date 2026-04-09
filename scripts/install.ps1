#Requires -Version 5.1

$ErrorActionPreference = 'Stop'

# Repo root is the parent of scripts/
$RepoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=== Agent Forge Installer ===" -ForegroundColor Cyan
Write-Host "Repository: $RepoRoot"
Write-Host ""

# --- Prerequisites ---------------------------------------------------
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Error "Node.js is not installed. Install Node.js 18+ from https://nodejs.org"
    exit 1
}
$nodeVersion = node --version
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Error "npm is not installed."
    exit 1
}
$npmVersion = npm --version
Write-Host "  npm:     $npmVersion" -ForegroundColor Green

$code = Get-Command code -ErrorAction SilentlyContinue
if (-not $code) {
    Write-Warning "VS Code CLI (code) not found on PATH. Extension install will be skipped."
    $skipVSIX = $true
} else {
    Write-Host "  VS Code: found" -ForegroundColor Green
    $skipVSIX = $false
}

Write-Host ""

# --- Install & Build -------------------------------------------------
Push-Location $RepoRoot
try {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    Write-Host "  Dependencies installed." -ForegroundColor Green

    Write-Host "Building @agent-forge/core..." -ForegroundColor Yellow
    npm run build -w packages/core
    if ($LASTEXITCODE -ne 0) { throw "Core build failed" }
    Write-Host "  Core built." -ForegroundColor Green

    Write-Host "Building VS Code extension..." -ForegroundColor Yellow
    npm run build -w packages/extension
    if ($LASTEXITCODE -ne 0) { throw "Extension build failed" }
    Write-Host "  Extension built." -ForegroundColor Green

    Write-Host "Building CLI..." -ForegroundColor Yellow
    npm run build -w packages/cli
    if ($LASTEXITCODE -ne 0) { throw "CLI build failed" }
    Write-Host "  CLI built." -ForegroundColor Green

    # --- Package & install extension ------------------------------------
    if (-not $skipVSIX) {
        Write-Host "Packaging extension as VSIX..." -ForegroundColor Yellow
        Push-Location "$RepoRoot\packages\extension"
        try {
            npx @vscode/vsce package --no-dependencies
            if ($LASTEXITCODE -ne 0) { throw "VSIX packaging failed" }
            $vsix = Get-ChildItem -Filter "*.vsix" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            Write-Host "  Packaged: $($vsix.Name)" -ForegroundColor Green

            Write-Host "Installing extension..." -ForegroundColor Yellow
            code --install-extension $vsix.FullName
            if ($LASTEXITCODE -ne 0) { throw "Extension install failed" }
            Write-Host "  Extension installed." -ForegroundColor Green
        } finally {
            Pop-Location
        }
    }

    # --- Set up CLI -----------------------------------------------------
    Write-Host "Setting up CLI..." -ForegroundColor Yellow
    $binDir = Join-Path $env:USERPROFILE ".agent-forge\bin"
    if (-not (Test-Path $binDir)) {
        New-Item -ItemType Directory -Path $binDir -Force | Out-Null
    }

    Copy-Item "$RepoRoot\packages\cli\dist\*" $binDir -Recurse -Force
    Write-Host "  CLI copied to $binDir" -ForegroundColor Green

    # Add to user PATH if not already present
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ($userPath -notlike "*$binDir*") {
        [Environment]::SetEnvironmentVariable('Path', "$userPath;$binDir", 'User')
        Write-Host "  Added $binDir to user PATH" -ForegroundColor Green
        Write-Host "  NOTE: Restart your terminal for PATH changes to take effect." -ForegroundColor Yellow
    } else {
        Write-Host "  $binDir already in PATH" -ForegroundColor Green
    }

} finally {
    Pop-Location
}

Write-Host ""
Write-Host "=== Installation Complete ===" -ForegroundColor Cyan
Write-Host "  Extension: $(if ($skipVSIX) { 'skipped (no VS Code CLI)' } else { 'installed' })"
Write-Host "  CLI:       $binDir"
Write-Host ""
Write-Host "Usage:"
Write-Host "  VS Code:  Open Command Palette > 'Agent Forge: Deploy'"
Write-Host "  CLI:      agent-forge deploy --repo `"$RepoRoot`""
