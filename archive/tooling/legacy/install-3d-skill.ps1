$ErrorActionPreference = "Stop"
$src = "C:\Users\HardyHeron\.workbuddy\skills\3d-animation-short-generator"
$dst = Join-Path (Get-Location) "skills\3d-animation-short-generator"
if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item (Join-Path $src "*") $dst -Recurse -Force
$count = (Get-ChildItem $dst -Recurse -File).Count
Write-Output "copied_files=$count"
