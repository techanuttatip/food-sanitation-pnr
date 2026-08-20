Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\ACER\.gemini\antigravity\brain\bb6b4457-53e0-4c7a-8b65-5d929d6272a5\line_richmenu_white_minimal_1787196578758.jpg"
$destPathJpg = "D:\food\public\richmenu_white_2500x1686.jpg"
$destPathPng = "D:\food\public\richmenu_white_2500x1686.png"
$artifactPath = "C:\Users\ACER\.gemini\antigravity\brain\bb6b4457-53e0-4c7a-8b65-5d929d6272a5\richmenu_white_2500x1686.jpg"

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
$bmp.Save($artifactPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)

# Also update default public/richmenu_pnr.jpg
$bmp.Save("D:\food\public\richmenu_pnr.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)

$src.Dispose()
$bmp.Dispose()
$graphics.Dispose()

Write-Host "Success! White Minimal Rich Menu resized to EXACTLY 2500 x 1686 pixels."
