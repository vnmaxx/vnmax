$headers = @{
    "Authorization" = "Bearer vc_8IhPlHS9ufe4qxWr568kMWNpHz6bh0q3ij2y8SO1KZurqnBCxF2mQxiB"
}

$response = Invoke-RestMethod -Uri "https://api.vercel.com/v6/domains/vnmax.org" -Method Get -Headers $headers
Write-Host ($response | ConvertTo-Json -Depth 10)