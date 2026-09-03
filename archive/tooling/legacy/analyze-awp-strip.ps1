Add-Type -AssemblyName System.Drawing
$path = "uploads\2026-08-20T230724-jimeng-2026-08-18-8526-AWP-SNIPER-RIFLE-WEAPON-DESIGN-SHE.png"
$img = [System.Drawing.Bitmap]::FromFile($path)
$w = $img.Width; $h = $img.Height

# 武器带：纵向 35%~65% 高度（中部横带），沿横向 40 段采样平均色
$cols = 40
$out = ""
for ($ci = 0; $ci -lt $cols; $ci++) {
  $sumR = 0; $sumG = 0; $sumB = 0; $n = 0
  for ($gy = 0; $gy -lt 60; $gy++) {
    $x = [int](($ci + 0.5) * $w / $cols)
    $y = [int]((0.35 + 0.3 * $gy / 60) * $h)
    $p = $img.GetPixel($x, $y)
    $sumR += $p.R; $sumG += $p.G; $sumB += $p.B; $n++
  }
  $r = [int]($sumR/$n); $g = [int]($sumG/$n); $b = [int]($sumB/$n)
  # 分类：白/浅=背景，绿=橄榄，棕=木，黑灰=金属
  $cat = ""
  if ($r -gt 200 -and $g -gt 200 -and $b -gt 200) { $cat = "." }
  elseif ($g -gt $r -and $g -gt $b -and ($g - $r) -gt 15) { $cat = "G" }       # 绿
  elseif ($r -gt $g -and $r -gt $b -and ($r - $g) -gt 25) { $cat = "W" }      # 暖棕/红
  elseif ($r -lt 90 -and $g -lt 90 -and $b -lt 90) { $cat = "#" }             # 深黑
  else { $cat = "+" }                                                          # 灰/其他
  $out += $cat
  $hex = "#{0:X2}{1:X2}{2:X2}" -f $r, $g, $b
  Write-Output ("col{0:D2} {1} {2}" -f $ci, $cat, $hex)
}
$img.Dispose()
