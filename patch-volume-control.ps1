$file = "Z:\projects\Orbit\node_modules\react-native-volume-control\android\src\main\java\com\rtmalone\volumecontrol\RNVolumeControlModule.java"

# Check if file exists
if (Test-Path $file) {
    # Read the file content
    $content = Get-Content $file -Raw
    
    # Replace android.support.annotation with androidx.annotation
    $content = $content -replace "android\.support\.annotation", "androidx.annotation"
    
    # Write the modified content back to the file
    Set-Content -Path $file -Value $content -Force
    
    Write-Host "Successfully patched RNVolumeControlModule.java"
} else {
    Write-Host "File not found: $file"
}
