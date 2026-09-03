Add-Type -AssemblyName System.Drawing
$srcPath = (Resolve-Path "textures/ak47.png").Path
$dir = [System.IO.Path]::GetDirectoryName($srcPath)
$dstPath = [System.IO.Path]::Combine($dir, "ak47_1024.png")

# 释放原图句柄
$img = [System.Drawing.Image]::FromFile($srcPath)
$srcW = $img.Width
$srcH = $img.Height

# 目标 1024x1024（保持原纵横比，中心裁切/居中）
$side = 1024
$bmp = New-Object System.Drawing.Bitmap $side, $side
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
# 等比缩放到 1024，然后居中绘制（留透明边）
$scale = [double]$side / [Math]::Max($srcW, $srcH)
$w = [int]($srcW * $scale)
$h = [int]($srcH * $scale)
$offX = [int](($side - $w) / 2)
$offY = [int](($side - $h) / 2)
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($img, $offX, $offY, $w, $h)

# 释放原图句柄后再保存
$img.Dispose()
$g.Dispose()
$bmp.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

# 覆盖原文件
Move-Item $dstPath $srcPath -Force
Get-Item $srcPath | Select-Object Name, Length, @{n="size";e={[int][Math]::Sqrt((Get-Item $srcPath).Length)}}
