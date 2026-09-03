$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$path = (Resolve-Path "uploads/2026-08-18T001452-image.png").Path
$img = [System.Drawing.Image]::FromFile($path)
$bmp = New-Object System.Drawing.Bitmap($img)
$w = $bmp.Width; $h = $bmp.Height

$cols = 66; $rows = 30
$chars = " .:-=+*#%@"
for ($ry = 0; $ry -lt $rows; $ry++) {
  $line = ""
  for ($cx = 0; $cx -lt $cols; $cx++) {
    $x0 = [int]($cx * $w / $cols); $x1 = [int](($cx + 1) * $w / $cols)
    $y0 = [int]($ry * $h / $rows); $y1 = [int](($ry + 1) * $h / $rows)
    $sum = 0.0; $cnt = 0
    for ($x = $x0; $x -lt $x1; $x += 2) {
      for ($y = $y0; $y -lt $y1; $y += 2) {
        $c = $bmp.GetPixel($x, $y)
        $sum += ($c.R + $c.G + $c.B) / 3.0
        $cnt++
      }
    }
    if ($cnt -eq 0) { $cnt = 1 }
    $avg = $sum / $cnt
    # 亮度映射：暗部更细分（图片整体偏暗）
    $idx = [int][Math]::Floor($avg / 25.6)
    if ($idx -lt 0) { $idx = 0 }
    if ($idx -gt 9) { $idx = 9 }
    $line += $chars[$idx]
  }
  Write-Output $line
}
$bmp.Dispose()
$img.Dispose()
