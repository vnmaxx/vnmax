param(
    [string]$Source = "",
    [string]$Output = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

if ([string]::IsNullOrWhiteSpace($Source)) {
    $Source = Join-Path $repoRoot "vnmax-os"
}

if ([string]::IsNullOrWhiteSpace($Output)) {
    $Output = Join-Path $repoRoot "exports\vnmax-os-v1.zip"
}

$sourcePath = Resolve-Path $Source
$outputParent = Split-Path -Parent $Output

if (-not $sourcePath.Path.StartsWith($repoRoot.Path, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Source must be inside the repository."
}

if (-not (Test-Path -LiteralPath $outputParent)) {
    New-Item -ItemType Directory -Path $outputParent | Out-Null
}

$resolvedOutputParent = Resolve-Path $outputParent

if (-not $resolvedOutputParent.Path.StartsWith($repoRoot.Path, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Output must be inside the repository."
}

if (Test-Path -LiteralPath $Output) {
    Remove-Item -LiteralPath $Output -Force
}

Compress-Archive -Path (Join-Path $sourcePath.Path "*") -DestinationPath $Output -Force

Write-Host "VNMAX OS packaged at $Output"
