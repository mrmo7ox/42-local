
#!/bin/bash

downloadUrl="https://portswigger.net/burp/releases/download?product=community&version=2025.3.4&type=Linux"
tmpFile="$HOME/goinfre/burp.sh"


if [ -n "$ZSH_VERSION" ]; then
    shell_rc="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    shell_rc="$HOME/.bashrc"
else
    shell_rc="$HOME/.profile"
fi
echo "Downloading Burp..."
mkdir -p "$(dirname "$tmpFile")"
curl -L "$downloadUrl" -o "$tmpFile" || { echo "Download failed!"; exit 1; }

chmod +x "$tmpFile"
$tmpFile