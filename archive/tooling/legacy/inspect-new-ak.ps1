$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$path = (Resolve-Path "uploads/2026-08-18T160151-image.png").Path
$img = [System.Drawing.Image]::FromFile($path)
$bmp = New-Object System.Drawing.Bitmap $img
$w = $bmp.Width
$h = $bmp.Height
Write-Output ("size={0}x{1}" -f $w, $h)

$colors = @{}
$step = 4
for ($x = 0; $x -lt $w; $x += $step) {
  for ($y = 0; $y -lt $h; $y += $step) {
    $c = $bmp.GetPixel($x, $y)
    $r = [int]($c.R / 16) * 16
    $g = [int]($c.G / 16) * 16
    $b = [int]($c.B / 16) * 16
    $a = $c.A
    $key = ("{0:X2}{1:X2}{2:X2} a={3}" -f $r, $g, $b, $a)
    if ($colors.ContainsKey($key)) { $colors[$key]++ } else { $colors[$key] = 1 }
  }
}

Write-Output "top_colors:"
$colors.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 12 | ForEach-Object {
  Write-Output ("  {0} count={1}" -f $_.Key, $_.Value)
}

$total = 0; $sr = 0; $sg = 0; $sb = 0
foreach ($e in $colors.GetEnumerator()) {
  $hex = $e.Key.Substring(0, 6)
  $rr = [Convert]::ToInt32($hex.Substring(0,2), 16)
  $gg = [Convert]::ToInt32($hex.Substring(2,2), 16)
  $bb = [Convert]::ToInt32($hex.Substring(4,2), 16)
  $sr += $rr * $e.Value; $sg += $gg * $e.Value; $sb += $bb * $e.Value
  $total += $e.Value
}
$avgR = [int]($sr / $total); $avgG = [int]($sg / $total); $avgB = [int]($sb / $total)
Write-Output ("avg=#{0:X2}{1:X2}{2:X2}" -f $avgR, $avgG, $avgB)

# 分区采样：4 角 + 中心，看是否有明显的"画面"特征（区别于纯色 UV 贴图）
$regions = @(
  @{name="topLeft";   x=[int]($w*0.1); y=[int]($h*0.1)},
  @{name="topRight";  x=[int]($w*0.9); y=[int]($h*0.1)},
  @{name="center";    x=[int]($w*0.5); y=[int]($h*0.5)},
  @{name="botLeft";   x=[int]($w*0.1); y=[int]($h*0.9)},
  @{name="botRight";  x=[int]($w*0.9); y=[int]($h*0.9)}
)
Write-Output "region_samples:"
foreach ($r in $regions) {
  $c = $bmp.GetPixel($r.x, $r.y)
  $hex = ("#{0:X2}{1:X2}{2:X2}" -f $c.R, $c.G, $c.B)
  Write-Output ("  {0} ({1},{2}) = {3}" -f $r.name, $r.x, $r.y, $hex)
}

$bmp.Dispose()
$img.Dispose()
