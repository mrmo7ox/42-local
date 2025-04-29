#!/bin/bash

# Config
downloadUrl="https://code.visualstudio.com/sha/download?build=stable&os=linux-x64"
installDir="$HOME/.var/app/vscode_stable"
tmpFile="$HOME/goinfre/code-stable-x64.tar.gz"
binaryPath="$installDir/VSCode-linux-x64/bin/code"
iconPath="$installDir/VSCode-linux-x64/resources/app/resources/linux/code.png"
desktopFile="$HOME/.local/share/applications/vscode.desktop"
aliasName="code"
if [ -n "$ZSH_VERSION" ]; then
    shell_rc="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    shell_rc="$HOME/.bashrc"
else
    shell_rc="$HOME/.profile"
fi
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
mkdir -p "$HOME/.local/share/applications/"
echo -e "[Desktop Entry]\nName=Visual Studio Code\nComment=Code Editing.\nExec=$binaryPath\nIcon=$iconPath\nTerminal=false\nType=Application\n" \
  > "$desktopFile"
chmod +x "$desktopFile"
chmod +x "$binaryPath"
rm -rf $tmpFile
# Step 4: Add alias
if ! grep -q "alias $aliasName=" "$shell_rc"; then
    echo "alias $aliasName=\"$binaryPath\"" >> "$shell_rc"
    echo "Alias '$aliasName' added to $shell_rc"
else
    echo "Alias '$aliasName' already exists in $shell_rc"
fi

echo "Done. Reload your shell or run 'source $shell_rc' to use the alias."