#!/bin/bash

# Function to clean files/folders
clean_glob() {
    if [ -d "$1" ]; then
        sleep 0.05
        echo "Deleting directory: $1"
        rm -rf "$1"
    elif [ -f "$1" ]; then
        sleep 0.05
        echo "Deleting file: $1"
        rm -f "$1"
    else
        sleep 0.05
        echo "$1 is already deleted"
    fi
}

# 42 Caches
clean_glob "$HOME"/Library/*.42*
clean_glob "$HOME"/*.42*
clean_glob "$HOME"/.zcompdump*
clean_glob "$HOME"/.cocoapods.42_cache_bak*

# Trash
clean_glob "$HOME"/.Trash/*

# General Caches files
# Giving access rights on Homebrew caches, so the script can delete them
/bin/chmod -R 777 "$HOME"/Library/Caches/Homebrew &>/dev/null
clean_glob "$HOME"/Library/Caches/*
clean_glob "$HOME"/Library/Application\ Support/Caches/*

# Slack, VSCode, Discord, and Chrome Caches
clean_glob "$HOME"/Library/Application\ Support/Slack/Service\ Worker/CacheStorage/*
clean_glob "$HOME"/Library/Application\ Support/Slack/Cache/*
clean_glob "$HOME"/Library/Application\ Support/discord/Cache/*
clean_glob "$HOME"/Library/Application\ Support/discord/Code\ Cache/js*
clean_glob "$HOME"/Library/Application\ Support/discord/Crashpad/completed/*
clean_glob "$HOME"/Library/Application\ Support/Code/Cache/*
clean_glob "$HOME"/Library/Application\ Support/Code/CachedData/*
clean_glob "$HOME"/Library/Application\ Support/Code/Crashpad/completed/*
clean_glob "$HOME"/Library/Application\ Support/Code/User/workspaceStorage/*
clean_glob "$HOME"/Library/Application\ Support/Google/Chrome/Profile\ [0-9]/Service\ Worker/CacheStorage/*
clean_glob "$HOME"/Library/Application\ Support/Google/Chrome/Default/Service\ Worker/CacheStorage/*
clean_glob "$HOME"/Library/Application\ Support/Google/Chrome/Profile\ [0-9]/Application\ Cache/*
clean_glob "$HOME"/Library/Application\ Support/Google/Chrome/Default/Application\ Cache/*
clean_glob "$HOME"/Library/Application\ Support/Google/Chrome/Crashpad/completed/*
clean_glob "$HOME"/Library/Application\ Support/BraveSoftware/Brave-Browser/Profile\ [0-9]/Service\ Worker/CacheStorage/*
clean_glob "$HOME"/Library/Application\ Support/BraveSoftware/Brave-Browser/Default/Service\ Worker/CacheStorage/*
clean_glob "$HOME"/Library/Application\ Support/BraveSoftware/Brave-Browser/Profile\ [0-9]/Application\ Cache/*
clean_glob "$HOME"/Library/Application\ Support/BraveSoftware/Brave-Browser/Default/Application\ Cache/*
clean_glob "$HOME"/Library/Application\ Support/BraveSoftware/Brave-Browser/Crashpad/completed/*
clean_glob "$HOME"/Library/Application\ Support/Spotify/PersistentCache/*

clean_glob "$HOME"/Desktop/**/*/.DS_Store

clean_glob "$HOME"/Library/Application\ Support/Chromium/Default/File\ System
clean_glob "$HOME"/Library/Application\ Support/Chromium/Profile\ [0-9]/File\ System
clean_glob "$HOME"/Library/Application\ Support/Google/Chrome/Default/File\ System
clean_glob "$HOME"/Library/Application\ Support/Google/Chrome/Profile\ [0-9]/File\ System
clean_glob "$HOME"/Library/Application\ Support/BraveSoftware/Brave-Browser/Default/File\ System
clean_glob "$HOME"/Library/Application\ Support/BraveSoftware/Brave-Browser/Profile\ [0-9]/File\ System

clean_glob "$HOME/.cache/appstream"
clean_glob "$HOME/.cache/evolution"
clean_glob "$HOME/.cache/flatpak"
clean_glob "$HOME/.cache/folks"
clean_glob "$HOME/.cache/fontconfig"
clean_glob "$HOME/.cache/gnome-calculator"
clean_glob "$HOME/.cache/gnome-desktop-thumbnailer"
clean_glob "$HOME/.cache/gnome-software"
clean_glob "$HOME/.cache/gstreamer-1.0"
clean_glob "$HOME/.cache/mesa_shader_cache"
clean_glob "$HOME/.cache/mesa_shader_cache"
clean_glob "$HOME/.cache/pip"
clean_glob "$HOME/.cache/qBittorrent"
clean_glob "$HOME/.cache/thumbnails"
clean_glob "$HOME/.cache/tracker3"
clean_glob "$HOME/.cache/typescript"
clean_glob "$HOME/.cache/vscode-cpptools"
clean_glob "$HOME/.config/42-local"
clean_glob "$HOME/.config/qBittorrent"
clean_glob "$HOME/.config/htop"
clean_glob "$HOME/.local/share/vlc"
clean_glob "$HOME/.local/share/gnote"
clean_glob "$HOME/.local/share/Trash"
clean_glob "$HOME/.local/share/nano"
clean_glob "$HOME/.local/share/qBittorrent"
clean_glob "$HOME/.var/app/com.google.Chrome"
clean_glob "$HOME/.var/app/*/cache"

echo "Cleaning completed."
