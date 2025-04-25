#!/bin/bash

# Config
downloadUrl="https://code.visualstudio.com/sha/download?build=stable&os=linux-x64"
installDir="$HOME/.var/app/vscode_stable"
tmpFile="$HOME/goinfre/code-stable-x64.tar.gz"
binaryPath="$installDir/VSCode-linux-x64/bin/code"
iconPath="$installDir/VSCode-linux-x64/resources/app/resources/linux/code.png"
desktopFile="$HOME/.local/share/applications/vscode.desktop"
aliasName="code"

# Step 1: Download VSCode
echo "Downloading VSCode..."
mkdir -p "$(dirname "$tmpFile")"
curl -L "$downloadUrl" -o "$tmpFile" || { echo "Download failed!"; exit 1; }

# Step 2: Extract to installDir
echo "Extracting VSCode to $installDir..."
mkdir -p "$installDir"
tar -xzf "$tmpFile" -C "$installDir" || { echo "Extraction failed!"; exit 1; }

# Step 3: Create .desktop file
echo "Creating .desktop launcher..."
mkdir -p "$(dirname "$desktopFile")"
cat > "$desktopFile" <<EOF
[Desktop Entry]
Name=Visual Studio Code
Comment=Code Editing. Redefined.
Exec=$binaryPath %F
Icon=$iconPath
Terminal=false
Type=Application
Categories=Development;IDE;
StartupNotify=true
EOF

chmod +x "$desktopFile"
rm -rf $tmpFile
# Step 4: Add alias
shell_rc="$HOME/.bashrc"
if ! grep -q "alias $aliasName=" "$shell_rc"; then
    echo "alias $aliasName=\"$binaryPath\"" >> "$shell_rc"
    echo "Alias '$aliasName' added to $shell_rc"
else
    echo "Alias '$aliasName' already exists in $shell_rc"
fi

echo "Done. Reload your shell or run 'source $shell_rc' to use the alias."