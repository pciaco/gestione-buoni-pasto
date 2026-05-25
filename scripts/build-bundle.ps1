# Build production bundle tarball for Proxmox deploy
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not (Test-Path "build\index.js")) {
    npm run build
}

$Out = Join-Path $Root "deploy-bundle.tar.gz"
if (Test-Path $Out) { Remove-Item $Out }

$stage = Join-Path $env:TEMP "gestione-buoni-bundle"
$target = Join-Path $stage "gestione-buoni-pasto"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $target -Force | Out-Null
foreach ($item in @("build", "package.json", "package-lock.json", "scripts", "deploy")) {
    Copy-Item -Recurse (Join-Path $Root $item) (Join-Path $target $item)
}
& tar -czf $Out -C $stage "gestione-buoni-pasto"
Remove-Item $stage -Recurse -Force

Write-Host "Created: $Out"
Write-Host ""
Write-Host "Deploy from Proxmox host (root SSH to 192.168.1.52):"
Write-Host "  scp deploy-bundle.tar.gz root@192.168.1.52:/tmp/"
Write-Host "  ssh root@192.168.1.52 'bash -s' < scripts/deploy-from-proxmox-host.sh 107 /tmp/deploy-bundle.tar.gz"
Write-Host ""
Write-Host "Or from CT console (after uploading bundle to /tmp manually):"
Write-Host "  tar xzf /tmp/deploy-bundle.tar.gz -C /opt && ..."
