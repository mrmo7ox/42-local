#!/bin/bash
set -e  # Exit on any error

REPO_URL="https://github.com/mrmo7ox/gnome-ft_lock.git"
CLONE_DIR="gnome-ft_lock"
EXTENSIONS_DIR="$HOME/.local/share/gnome-shell/extensions"
EXTENSION_NAME="topbar-icon@mrmo7ox"
TARGET_DIR="$EXTENSIONS_DIR/$EXTENSION_NAME"

if [ -d "$CLONE_DIR" ]; then
  echo "Repository exists. Pulling latest changes..."
  cd "$CLONE_DIR"
  git pull origin main || git pull origin master
  cd ..
else
  echo "Cloning repository..."
  git clone "$REPO_URL"
fi

mkdir -p "$EXTENSIONS_DIR"

if [ -d "$TARGET_DIR" ]; then
  echo "Removing old extension directory..."
  rm -rf "$TARGET_DIR"
fi

mv "$CLONE_DIR" "$TARGET_DIR"

if ! gnome-extensions info "$EXTENSION_NAME" | grep -q "State: ENABLED"; then
  echo "Enabling extension $EXTENSION_NAME..."
  gnome-extensions enable topbar-icon@mrmo7ox
else
  echo "Extension $EXTENSION_NAME is already enabled."
fi

echo "Done."
