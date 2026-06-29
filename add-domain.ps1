$headers = @{
    "Authorization" = "Bearer vc_8IhPlHS9ufe4qxWr568kMWNpHz6bh0q3ij2y8SO1KZurqnBCxF2mQxiB"
    "Content-Type" = "application/json"
}

$body = @{
    name = "vnmax.org"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://api.vercel.com/v6/domains" -Method Post -Headers $headers -Body $body
Write-Host $response