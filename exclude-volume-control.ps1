$moduleDir = "Z:\projects\Orbit\node_modules\react-native-volume-control"

# Check if the directory exists
if (Test-Path $moduleDir) {
    # Rename the directory to disable it during build
    Rename-Item -Path $moduleDir -NewName "react-native-volume-control-disabled" -Force
    Write-Host "Successfully disabled react-native-volume-control module"
} else {
    Write-Host "Module directory not found: $moduleDir"
}
