Add-Type -AssemblyName System.Drawing
$srcPath = (Resolve-Path "textures/usp.png").Path
$dir = [System.IO.Path]::GetDirectoryName($srcPath)
$dstPath = [System.IO.Path]::Combine($dir, "usp_1024.png")

$img = [System.Drawing.Image]::FromFile($srcPath)
$srcW = $img.Width
$srcH = $img.Height

$side = 1024
$bmp = New-Object System.Drawing.Bitmap $side, $side
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$scale = [double]$side / [Math]::Max($srcW, $srcH)
$w = [int]($srcW * $scale)
$h = [int]($srcH * $scale)
$offX = [int](($side - $w) / 2)
$offY = [int](($side - $h) / 2)
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($img, $offX, $offY, $w, $h)

$img.Dispose()
$g.Dispose()
$bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Move-Item $dstPath $srcPath -Force
Get-Item $srcPath | Select-Object Name, Length
