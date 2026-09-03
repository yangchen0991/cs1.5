$paths = @(
  "uploads/2026-08-18T153856-2089387045205053440.png",
  "uploads/2026-08-18T153856-2089403292898562048.jpg",
  "uploads/2026-08-18T153856-mulan_2026_08_18_sGdopi-WoqONPx6zfUj4k.png"
)
Add-Type -AssemblyName System.Drawing
foreach ($p in $paths) {
  $img = [System.Drawing.Image]::FromFile((Resolve-Path $p).Path)
  $bmp = New-Object System.Drawing.Bitmap $img
  Write-Output ("=== " + $p + "  size=" + $bmp.Width + "x" + $bmp.Height + " ===")
  $colors = @{}
  $step = 8
  for ($x=0; $x -lt $bmp.Width; $x += $step) {
    for ($y=0; $y -lt $bmp.Height; $y += $step) {
      $c = $bmp.GetPixel($x, $y)
      $r = [int]($c.R / 16) * 16
      $g = [int]($c.G / 16) * 16
      $b = [int]($c.B / 16) * 16
      $k = ("{0:X2}{1:X2}{2:X2}" -f $r, $g, $b)
      if ($colors.ContainsKey($k)) { $colors[$k]++ } else { $colors[$k] = 1 }
    }
  }
  $total = 0; $sr = 0; $sg = 0; $sb = 0
  foreach ($e in $colors.GetEnumerator()) {
    $hex = $e.Key
    $rr = [Convert]::ToInt32($hex.Substring(0,2), 16)
    $gg = [Convert]::ToInt32($hex.Substring(2,2), 16)
    $bb = [Convert]::ToInt32($hex.Substring(4,2), 16)
    $sr += $rr * $e.Value; $sg += $gg * $e.Value; $sb += $bb * $e.Value
    $total += $e.Value
  }
  $avgR = [int]($sr / $total); $avgG = [int]($sg / $total); $avgB = [int]($sb / $total)
  Write-Output ("  avg=#{0:X2}{1:X2}{2:X2}" -f $avgR, $avgG, $avgB)
  $colors.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 6 | ForEach-Object {
    Write-Output ("  #{0} count={1}" -f $_.Key, $_.Value)
  }
  $bmp.Dispose()
  $img.Dispose()
}
