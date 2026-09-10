# Toby Math local static server (no Python / Node needed).
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$port = 8000

$mime = @{
  '.html'  = 'text/html; charset=utf-8'
  '.css'   = 'text/css; charset=utf-8'
  '.js'    = 'application/javascript; charset=utf-8'
  '.json'  = 'application/json; charset=utf-8'
  '.png'   = 'image/png'
  '.jpg'   = 'image/jpeg'
  '.jpeg'  = 'image/jpeg'
  '.gif'   = 'image/gif'
  '.svg'   = 'image/svg+xml'
  '.ico'   = 'image/x-icon'
  '.webp'  = 'image/webp'
  '.pdf'   = 'application/pdf'
  '.txt'   = 'text/plain; charset=utf-8'
  '.woff'  = 'font/woff'
  '.woff2' = 'font/woff2'
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")
try {
  $listener.Start()
} catch {
  $tcp = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
  $tcp.Start()
  $port = ([System.Net.IPEndPoint]$tcp.LocalEndpoint).Port
  $tcp.Stop()
  $listener.Prefixes.Clear()
  $listener.Prefixes.Add("http://localhost:$port/")
  $listener.Start()
}

Write-Host ""
Write-Host "  Toby Math is running at  http://localhost:$port/  " -ForegroundColor Cyan
Write-Host "  Press Ctrl+C in this window to stop." -ForegroundColor DarkGray
Write-Host ""
Start-Process "http://localhost:$port/"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
  } catch {
    break
  }
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $path = $req.Url.AbsolutePath.TrimStart('/')
    if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }

    $full = [System.IO.Path]::GetFullPath((Join-Path $root $path))
    $rootFull = [System.IO.Path]::GetFullPath($root)
    if (-not $full.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
      $res.StatusCode = 403
      $res.Close()
      continue
    }

    if ([System.IO.Directory]::Exists($full)) {
      $full = Join-Path $full 'index.html'
    }

    if ([System.IO.File]::Exists($full)) {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
      $res.OutputStream.Close()
    } else {
      $res.StatusCode = 404
      $res.StatusDescription = 'Not Found'
      $res.Close()
    }
  } catch {
    try { $res.StatusCode = 500; $res.Close() } catch {}
  }
}