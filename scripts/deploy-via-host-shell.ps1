# Copia il bundle sul nodo Proxmox e lancia deploy (richiede SSH root sul host PVE).
param(
    [string]$ProxmoxHost = "192.168.1.52",
    [string]$Bundle = "deploy-bundle.tar.gz"
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root
if (-not (Test-Path $Bundle)) { & "$Root\scripts\build-bundle.ps1" }
$BundlePath = Join-Path $Root $Bundle
Write-Host "Copia bundle su Proxmox host..."
scp $BundlePath "root@${ProxmoxHost}:/tmp/deploy-bundle.tar.gz"
Write-Host "Esegui deploy nel CT 107..."
Get-Content "$Root\scripts\deploy-via-host-shell.sh" -Raw | ssh "root@${ProxmoxHost}" "bash -s" "/tmp/deploy-bundle.tar.gz"
