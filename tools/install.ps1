param(
	[string]$ModulesPath = "$env:LOCALAPPDATA\FoundryVTT\Data\modules"
)

# Packs are LevelDB databases: stale files left in the target override new ones,
# so the installed module folder is always replaced, never merged.
$id = "intelligent-weapons-ancestry-pf2e"
$root = Split-Path $PSScriptRoot -Parent
$target = Join-Path $ModulesPath $id

if (Test-Path $target) { Remove-Item $target -Recurse -Force }
New-Item -ItemType Directory $target | Out-Null

Copy-Item (Join-Path $root "module.json") $target
Copy-Item (Join-Path $root "README.md") $target
Copy-Item (Join-Path $root "packs") $target -Recurse -Exclude "_source"
Remove-Item (Join-Path $target "packs\_source") -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Installed to $target"
