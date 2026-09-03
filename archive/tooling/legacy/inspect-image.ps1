$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$path = (Resolve-Path "uploads/2026-08-18T001452-image.png").Path
$img = [System.Drawing.Image]::FromFile($path)
$bmp = New-Object System.Drawing.Bitmap($img)
$w = $bmp.Width
$h = $bmp.Height

$colors = @{}
$step = 4
for ($x = 0; $x -lt $w; $x += $step) {
  for ($y = 0; $y -lt $h; $y += $step) {
    $c = $bmp.GetPixel($x, $y)
    $r = [int]($c.R / 16) * 16
    $g = [int]($c.G / 16) * 16
    $b = [int]($c.B / 16) * 16
    $key = ("{0:X2}{1:X2}{2:X2}" -f $r, $g, $b)
    if ($colors.ContainsKey($key)) { $colors[$key]++ } else { $colors[$key] = 1 }
  }
}

Write-Output ("size={0}x{1}" -f $w, $h)
Write-Output "top_colors:"
$colors.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 14 | ForEach-Object {
  Write-Output ("#{0} count={1}" -f $_.Key, $_.Value)
}

# 平均色（加权）
$total = 0.0; $sr = 0.0; $sg = 0.0; $sb = 0.0
foreach ($e in $colors.GetEnumerator()) {
  $hex = $e.Key
  $rr = [Convert]::ToInt32($hex.Substring(0,2), 16)
  $gg = [Convert]::ToInt32($hex.Substring(2,2), 16)
  $bb = [Convert]::ToInt32($hex.Substring(4,2), 16)
  $sr += $rr * $e.Value; $sg += $gg * $e.Value; $sb += $bb * $e.Value
  $total += $e.Value
}
$avgR = [int]($sr / $total); $avgG = [int]($sg / $total); $avgB = [int]($sb / $total)
Write-Output ("avg_color=#{0:X2}{1:X2}{2:X2}" -f $avgR, $avgG, $avgB)

$bmp.Dispose()
$img.Dispose()
