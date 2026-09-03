Add-Type -AssemblyName System.Drawing
$path = "uploads\2026-08-21T125122-2090662103802187776-1.png"
$img = [System.Drawing.Bitmap]::FromFile($path)
$w = $img.Width; $h = $img.Height
Write-Output "Image: ${w}x${h}"

# Step 1: Detect view clusters (horizontal weapon bands)
$fine = 200
$colHas = @()
for ($cx = 0; $cx -lt $fine; $cx++) {
  $has = $false
  for ($cy = 0; $cy -lt 80; $cy++) {
    $x = [int](($cx + 0.5) * $w / $fine)
    $y = [int]((0.15 + 0.70 * $cy / 80) * $h)
    $p = $img.GetPixel($x, $y)
    if (-not ($p.R -gt 245 -and $p.G -gt 245 -and $p.B -gt 245)) { $has = $true; break }
  }
  $colHas += $has
}

# Group clusters
$clusters = New-Object System.Collections.ArrayList
$start = -1
for ($i = 0; $i -lt $fine; $i++) {
  if ($colHas[$i]) { if ($start -lt 0) { $start = $i } }
  else { if ($start -ge 0) { $clusters.Add(@($start, ($i - 1))) | Out-Null; $start = -1 } }
}
if ($start -ge 0) { $clusters.Add(@($start, ($fine - 1))) | Out-Null }

# Step 2: For each view, extract high-res silhouette (100 cols x 50 rows)
$viewIdx = 0
foreach ($cl in $clusters) {
  $c0 = $cl[0]; $c1 = $cl[1]
  if (($c1 - $c0) -lt 5) { continue }
  $viewIdx++
  Write-Output ""
  Write-Output "===== VIEW $viewIdx (cols $c0-$c1) ====="
  
  $vc = 80; $vr = 45
  $grid = @()
  for ($ry = 0; $ry -lt $vr; $ry++) {
    $row = ""
    for ($rx = 0; $rx -lt $vc; $rx++) {
      $px = [int](($c0 + ($c1 - $c0 + 1) * ($rx + 0.5) / $vc) * $w / $fine)
      $py = [int]((0.15 + 0.70 * ($ry + 0.5) / $vr) * $h)
      $p = $img.GetPixel($px, $py)
      $r = $p.R; $g = $p.G; $b = $p.B
      if ($r -gt 240 -and $g -gt 240 -and $b -gt 240) { $row += " " }
      elseif ($r -lt 60 -and $g -lt 60 -and $b -lt 60) { $row += "#" }
      elseif ($r -gt 140 -and $g -gt 100 -and $b -lt 80 -and ($r - $b) -gt 40) { $row += "W" }
      elseif ($g -gt $r -and $g -gt $b -and ($g - $r) -gt 15) { $row += "G" }
      elseif ($r -gt 120 -and $g -gt 120 -and $b -gt 120 -and ($r - $g) -lt 20 -and ($r - $b) -lt 20) { $row += "S" }
      elseif ($b -gt $r -and $b -gt $g -and $b -gt 100) { $row += "B" }
      else { $row += "." }
    }
    $grid += $row
  }
  
  # Output ASCII art
  for ($i = 0; $i -lt $grid.Count; $i++) {
    Write-Output $grid[$i]
  }
  
  # Step 3: Extract column profile (top/boundaries)
  Write-Output "--- Column Profile ---"
  for ($rx = 0; $rx -lt $vc; $rx += 4) {
    $minY = -1; $maxY = -1
    $domR = 0; $domG = 0; $domB = 0; $domN = 0
    for ($ry = 0; $ry -lt $vr; $ry++) {
      if ($grid[$ry][$rx] -ne " ") {
        if ($minY -lt 0) { $minY = $ry }
        $maxY = $ry
        $px = [int](($c0 + ($c1 - $c0 + 1) * ($rx + 0.5) / $vc) * $w / $fine)
        $py = [int]((0.15 + 0.70 * ($ry + 0.5) / $vr) * $h)
        $p = $img.GetPixel($px, $py)
        $domR += $p.R; $domG += $p.G; $domB += $p.B; $domN++
      }
    }
    if ($minY -ge 0 -and $domN -gt 0) {
      $r = [int]($domR/$domN); $g = [int]($domG/$domN); $b = [int]($domB/$domN)
      $hex = "#{0:X2}{1:X2}{2:X2}" -f $r, $g, $b
      Write-Output ("col{0:D2} y={1:D2}-{2:D2} h={3:D2} {4}" -f $rx, $minY, $maxY, ($maxY-$minY+1), $hex)
    }
  }
}
$img.Dispose()
