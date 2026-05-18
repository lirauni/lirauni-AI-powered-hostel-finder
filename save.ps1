# ── LiraUniHostel Backup Script ──────────────────────────────────────────
# Run this anytime you reach a stable point to save a timestamped backup.
# Double-click or run: powershell -ExecutionPolicy Bypass -File save.ps1

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupDir = "backups"

# Create backups folder if it doesn't exist
if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "Created backups/ folder." -ForegroundColor Cyan
}

# Copy host.html with timestamp
$dest = "$backupDir\host_$timestamp.html"
Copy-Item "host.html" -Destination $dest
Write-Host "Backup saved: $dest" -ForegroundColor Green

# Keep only the last 10 backups to save space
$backups = Get-ChildItem "$backupDir\host_*.html" | Sort-Object LastWriteTime
if ($backups.Count -gt 10) {
    $toDelete = $backups | Select-Object -First ($backups.Count - 10)
    $toDelete | Remove-Item
    Write-Host "Old backups cleaned up (kept last 10)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "All backups:" -ForegroundColor Cyan
Get-ChildItem "$backupDir\host_*.html" | Sort-Object LastWriteTime | ForEach-Object {
    Write-Host "  $($_.Name)" -ForegroundColor White
}

Write-Host ""
Write-Host "To restore a backup, copy it back:" -ForegroundColor Cyan
Write-Host "  Copy-Item 'backups\host_YYYY-MM-DD_HH-mm.html' -Destination 'host.html'" -ForegroundColor White
Write-Host ""
pause
