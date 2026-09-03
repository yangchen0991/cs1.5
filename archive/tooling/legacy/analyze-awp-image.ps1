Add-Type -AssemblyName System.Drawing
$path = "uploads\2026-08-20T230724-jimeng-2026-08-18-8526-AWP-SNIPER-RIFLE-WEAPON-DESIGN-SHE.png"
$img = [System.Drawing.Bitmap]::FromFile($path)
$w = $img.Width; $h = $img.Height
Write-Output "size=${w}x${h}"

# 1) 主色板（16 级量化，频率排序）
$gw = 96; $gh = 54
$counts = @{}
for ($gy = 0; $gy -lt $gh; $gy++) {
  for ($gx = 0; $gx -lt $gw; $gx++) {
    $x = [int](($gx + 0.5) * $w / $gw)
    $y = [int](($gy + 0.5) * $h / $gh)
    $p = $img.GetPixel($x, $y)
    $key = "$([int]($p.R/16)),$([int]($p.G/16)),$([int]($p.B/16))"
    if ($counts.ContainsKey($key)) { $counts[$key]++ } else { $counts[$key] = 1 }
  }
}
Write-Output "--- top 14 colors (hex, pct) ---"
$counts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 14 | ForEach-Object {
  $pp = $_.Key -split ','; $r = [int]$pp[0]*16; $g = [int]$pp[1]*16; $b = [int]$pp[2]*16
  $pct = [math]::Round($_.Value * 100 / ($gw*$gh), 1)
  Write-Output ("#{0:X2}{1:X2}{2:X2}  {3}%" -f $r, $g, $b, $pct)
}

# 2) 九宫格平均色（布局：武器主体位置/背景）
Write-Output "--- 3x3 region avg ---"
for ($ry = 0; $ry -lt 3; $ry++) {
  for ($rx = 0; $rx -lt 3; $rx++) {
    $sumR = 0; $sumG = 0; $sumB = 0; $n = 0
    for ($gy = [int]($ry*$gh/3); $gy -lt [int](($ry+1)*$gh/3); $gy++) {
      for ($gx = [int]($rx*$gw/3); $gx -lt [int](($rx+1)*$gw/3); $gx++) {
        $x = [int](($gx + 0.5) * $w / $gw); $y = [int](($gy + 0.5) * $h / $gh)
        $p = $img.GetPixel($x, $y)
        $sumR += $p.R; $sumG += $p.G; $sumB += $p.B; $n++
      }
    }
    $r = [int]($sumR/$n); $g = [int]($sumG/$n); $b = [int]($sumB/$n)
    Write-Output ("region($rx,$ry) #{0:X2}{1:X2}{2:X2}" -f $r, $g, $b)
  }
}
$img.Dispose()
