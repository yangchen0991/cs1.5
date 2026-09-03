Add-Type -AssemblyName System.Drawing
$path = "uploads\2026-08-20T230724-jimeng-2026-08-18-8526-AWP-SNIPER-RIFLE-WEAPON-DESIGN-SHE.png"
$img = [System.Drawing.Bitmap]::FromFile($path)
$w = $img.Width; $h = $img.Height

# 检测视图簇：120 列细网格，前景列分组
$fine = 120
$colHas = @()
for ($cx = 0; $cx -lt $fine; $cx++) {
  $has = $false
  for ($cy = 0; $cy -lt 40; $cy++) {
    $x = [int](($cx + 0.5) * $w / $fine); $y = [int]((0.25 + 0.5 * $cy / 40) * $h)
    $p = $img.GetPixel($x, $y)
    if (-not ($p.R -gt 232 -and $p.G -gt 232 -and $p.B -gt 232)) { $has = $true; break }
  }
  $colHas += $has
}
# 分组
$clusters = New-Object System.Collections.ArrayList
$start = -1
for ($i = 0; $i -lt $fine; $i++) {
  if ($colHas[$i]) { if ($start -lt 0) { $start = $i } }
  else { if ($start -ge 0) { $clusters.Add(@($start, ($i - 1))) | Out-Null; $start = -1 } }
}
if ($start -ge 0) { $clusters.Add(@($start, ($fine - 1))) | Out-Null }

$idx = 0
foreach ($cl in $clusters) {
  $c0 = $cl[0]; $c1 = $cl[1]
  if (($c1 - $c0) -lt 2) { continue }   # 忽略孤点
  $idx++
  Write-Output ""
  Write-Output "===== VIEW $idx (fine col $c0 - $c1, 画面 ${c0}-$([int]($c1*100/$fine))%) ====="
  # 该视图单独渲染：26 列 × 22 行
  $vc = 26; $vr = 22
  for ($ry = 0; $ry -lt $vr; $ry++) {
    $line = ""
    for ($rx = 0; $rx -lt $vc; $rx++) {
      $px = [int](($c0 + ($c1 - $c0 + 1) * ($rx + 0.5) / $vc) * $w / $fine)
      $py = [int]((0.22 + 0.56 * ($ry + 0.5) / $vr) * $h)
      $p = $img.GetPixel($px, $py)
      $r = $p.R; $g = $p.G; $b = $p.B
      if ($r -gt 228 -and $g -gt 228 -and $b -gt 228) { $line += " " }
      elseif ($g -gt $r -and $g -gt $b -and ($g - $r) -gt 12) { $line += "G" }
      elseif ($r -gt $g -and ($r - $g) -gt 18 -and $r -gt 110) { $line += "W" }
      elseif ($r -gt 150 -and $g -lt 140 -and $b -lt 100 -and ($r - $g) -gt 40) { $line += "O" }
      elseif ($r -lt 80 -and $g -lt 80 -and $b -lt 90) { $line += "#" }
      elseif ($b -gt $r -and $b -gt $g) { $line += "+" }
      else { $line += "." }
    }
    Write-Output $line
  }
}
$img.Dispose()
