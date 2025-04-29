#!/bin/bash

# Detect shell config file
if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
else
    SHELL_RC="$HOME/.profile"
fi

# Install NVM
echo "[*] Downloading and installing NVM..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Add NVM to shell config if not already present
if ! grep -q 'export NVM_DIR' "$SHELL_RC"; then
    echo "[*] Adding NVM configuration to $SHELL_RC"
    cat << 'EOF' >> "$SHELL_RC"

# NVM setup
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
EOF
else
    echo "[*] NVM already configured in $SHELL_RC"
fi

# Source shell config
echo "[*] Sourcing $SHELL_RC..."
source "$SHELL_RC"

# Confirm installation
if command -v nvm >/dev/null 2>&1; then
    echo "[✓] NVM installed successfully"
    echo "[*] Installing latest Node.js..."
    nvm install node
    echo "[*] Done! You can now use 'nvm use <version>'"
else
    echo "[✗] NVM installation failed"
fi

