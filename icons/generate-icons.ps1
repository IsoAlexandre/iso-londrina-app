Add-Type -AssemblyName System.Drawing

function New-Icon {
  param(
    [int]$Size,
    [bool]$Rounded,
    [string]$OutPath,
    [int]$FontSize
  )
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  $rect = New-Object System.Drawing.Rectangle 0, 0, $Size, $Size
  $colorA = [System.Drawing.Color]::FromArgb(255, 0x7F, 0xAE, 0x8D)
  $colorB = [System.Drawing.Color]::FromArgb(255, 0x4F, 0x72, 0x91)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $colorA, $colorB, 45)

  if ($Rounded) {
    $radius = [int]($Size * 0.21)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc(0, 0, $d, $d, 180, 90)
    $path.AddArc($Size - $d, 0, $d, $d, 270, 90)
    $path.AddArc($Size - $d, $Size - $d, $d, $d, 0, 90)
    $path.AddArc(0, $Size - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $g.FillPath($brush, $path)
  } else {
    $g.FillRectangle($brush, $rect)
  }

  $fontFamily = New-Object System.Drawing.FontFamily "Georgia"
  $font = New-Object System.Drawing.Font($fontFamily, $FontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $textBrush = [System.Drawing.Brushes]::White
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center

  $textY = [int]($Size * 0.44)
  $center = [System.Drawing.PointF]::new([single]($Size / 2), [single]$textY)
  $g.DrawString("ISO", $font, $textBrush, $center, $format)

  $barW = [int]($Size * 0.235)
  $barH = [Math]::Max(2, [int]($Size * 0.0175))
  $barX = [int](($Size - $barW) / 2)
  $barY = [int]($Size * 0.615)
  $barBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 0xE2, 0x96, 0x7A))
  $g.FillRectangle($barBrush, $barX, $barY, $barW, $barH)

  $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $brush.Dispose(); $font.Dispose(); $barBrush.Dispose()
}

$dir = $PSScriptRoot
New-Icon -Size 192 -Rounded $true  -OutPath (Join-Path $dir "icon-192.png") -FontSize 66
New-Icon -Size 512 -Rounded $true  -OutPath (Join-Path $dir "icon-512.png") -FontSize 176
New-Icon -Size 192 -Rounded $false -OutPath (Join-Path $dir "icon-maskable-192.png") -FontSize 56
New-Icon -Size 512 -Rounded $false -OutPath (Join-Path $dir "icon-maskable-512.png") -FontSize 150
New-Icon -Size 180 -Rounded $false -OutPath (Join-Path $dir "apple-touch-icon.png") -FontSize 62

Write-Host "Icons generated in $dir"
