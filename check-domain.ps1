if (-not $env:VERCEL_API_KEY) {
    Write-Error "Defina a variavel de ambiente VERCEL_API_KEY antes de rodar: `$env:VERCEL_API_KEY='...'"
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $($env:VERCEL_API_KEY)"
}

$response = Invoke-RestMethod -Uri "https://api.vercel.com/v6/domains/vnmax.org" -Method Get -Headers $headers
Write-Host ($response | ConvertTo-Json -Depth 10)