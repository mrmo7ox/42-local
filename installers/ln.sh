#!/bin/bash

target="$HOME/.local/share/flatpak"
symbolic="$HOME/goinfre/flatpak"

if [ -L "$target"  && "$symbolic" ]; then
    BOOL=0
else
    BOOL=1
fi

if [ "$BOOL" = 1 ]; then
    echo "Removing $target"
    rm -rf "$target"
    mkdir -p "$symbolic"
    echo "Adding a symbolic link: $target -> $symbolic"
    ln -s "$symbolic" "$target"

else
    echo "$target is already a symbolic link"
fi

flatpak remote-add --user --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo