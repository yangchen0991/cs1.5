$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$path = (Resolve-Path "uploads/2026-08-18T165320-jimeng-2026-08-18-8526-AWP-SNIPER-RIFLE-WEAPON-DESIGN-SHE.png").Path
$img = [System.Drawing.Image]::FromFile($path)
$bmp = New-Object System.Drawing.Bitmap $img
Write-Output ("size={0}x{1}" -f $bmp.Width, $bmp.Height)
$colors = @{}
$step = 8
for ($x = 0; $x -lt $bmp.Width; $x += $step) {
  for ($y = 0; $y -lt $bmp.Height; $y += $step) {
    $c = $bmp.GetPixel($x, $y)
    $r = [int]($c.R / 16) * 16
    $g = [int]($c.G / 16) * 16
    $b = [int]($c.B / 16) * 16
    $key = ("{0:X2}{1:X2}{2:X2}" -f $r, $g, $b)
    if ($colors.ContainsKey($key)) { $colors[$key]++ } else { $colors[$key] = 1 }
  }
}
$colors.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 10 | ForEach-Object {
  Write-Output ("#{0} count={1}" -f $_.Key, $_.Value)
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
Write-Output ("avg=#{0:X2}{1:X2}{2:X2}" -f ([int]($sr/$total)), ([int]($sg/$total)), ([int]($sb/$total)))
$bmp.Dispose()
$img.Dispose()
