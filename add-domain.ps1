if (-not $env:VERCEL_API_KEY) {
    Write-Error "Defina a variavel de ambiente VERCEL_API_KEY antes de rodar: `$env:VERCEL_API_KEY='...'"
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $($env:VERCEL_API_KEY)"
    "Content-Type" = "application/json"
}

$body = @{
    name = "vnmax.org"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://api.vercel.com/v6/domains" -Method Post -Headers $headers -Body $body
Write-Host $response