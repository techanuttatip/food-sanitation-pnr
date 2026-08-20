Add-Type -AssemblyName System.Drawing

$sourcePath = "D:\food\public\richmenu_pnr.jpg"
$destPathJpg = "D:\food\public\richmenu_2500x1686.jpg"
$destPathPng = "D:\food\public\richmenu_2500x1686.png"

$src = [System.Drawing.Image]::FromFile($sourcePath)
$bmp = New-Object System.Drawing.Bitmap 2500, 1686
$graphics = [System.Drawing.Graphics]::FromImage($bmp)

$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$rect = New-Object System.Drawing.Rectangle 0, 0, 2500, 1686
$graphics.DrawImage($src, $rect)

$bmp.Save($destPathJpg, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Save($destPathPng, [System.Drawing.Imaging.ImageFormat]::Png)

# Also overwrite richmenu_pnr.jpg so it is always 2500x1686
$src.Dispose()
$bmp.Save($sourcePath, [System.Drawing.Imaging.ImageFormat]::Jpeg)

$bmp.Dispose()
$graphics.Dispose()

Write-Host "Success! Image resized to EXACTLY 2500 x 1686 pixels."
