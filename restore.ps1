# ── LiraUniHostel Restore Script ─────────────────────────────────────────
# Run this to restore a previous backup of host.html

$backupDir = "backups"

if (!(Test-Path $backupDir)) {
    Write-Host "No backups folder found. Run save.ps1 first." -ForegroundColor Red
    pause
    exit
}

$backups = Get-ChildItem "$backupDir\host_*.html" | Sort-Object LastWriteTime -Descending

if ($backups.Count -eq 0) {
    Write-Host "No backups found in backups/ folder." -ForegroundColor Red
    pause
    exit
}

Write-Host "Available backups (newest first):" -ForegroundColor Cyan
Write-Host ""
for ($i = 0; $i -lt $backups.Count; $i++) {
    Write-Host "  [$($i+1)] $($backups[$i].Name)" -ForegroundColor White
}

Write-Host ""
$choice = Read-Host "Enter number to restore (or press Enter to cancel)"

if ($choice -match '^\d+$') {
    $idx = [int]$choice - 1
    if ($idx -ge 0 -and $idx -lt $backups.Count) {
        # Save current as emergency backup first
        $emergency = "$backupDir\host_BEFORE_RESTORE_$(Get-Date -Format 'yyyy-MM-dd_HH-mm').html"
        Copy-Item "host.html" -Destination $emergency
        Write-Host "Current version saved as: $($emergency | Split-Path -Leaf)" -ForegroundColor Yellow

        # Restore chosen backup
        Copy-Item $backups[$idx].FullName -Destination "host.html"
        Write-Host ""
        Write-Host "Restored: $($backups[$idx].Name)" -ForegroundColor Green
    } else {
        Write-Host "Invalid choice." -ForegroundColor Red
    }
} else {
    Write-Host "Cancelled." -ForegroundColor Yellow
}

Write-Host ""
pause
