Add-Type -AssemblyName System.Drawing
$path = "uploads\2026-08-20T230724-jimeng-2026-08-18-8526-AWP-SNIPER-RIFLE-WEAPON-DESIGN-SHE.png"
$img = [System.Drawing.Bitmap]::FromFile($path)
$w = $img.Width; $h = $img.Height

# 56 列 × 34 行 ASCII 渲染（颜色分类）
$cols = 56; $rows = 34
for ($cy = 0; $cy -lt $rows; $cy++) {
  $line = ""
  for ($cx = 0; $cx -lt $cols; $cx++) {
    $x = [int](($cx + 0.5) * $w / $cols); $y = [int](($cy + 0.5) * $h / $rows)
    $p = $img.GetPixel($x, $y)
    $r = $p.R; $g = $p.G; $b = $p.B
    if ($r -gt 228 -and $g -gt 228 -and $b -gt 228) { $line += " " }               # 背景
    elseif ($g -gt $r -and $g -gt $b -and ($g - $r) -gt 12) { $line += "G" }        # 橄榄绿
    elseif ($r -gt $g -and ($r - $g) -gt 18 -and $r -gt 110) { $line += "W" }       # 木/暖色
    elseif ($r -gt 150 -and $g -lt 140 -and $b -lt 100 -and ($r - $g) -gt 40) { $line += "O" }  # 橙青铜
    elseif ($r -lt 80 -and $g -lt 80 -and $b -lt 90) { $line += "#" }               # 深黑
    elseif ($b -gt $r -and $b -gt $g) { $line += "+" }                             # 蓝灰
    else { $line += "." }                                                           # 灰/其他
  }
  Write-Output $line
}
$img.Dispose()
