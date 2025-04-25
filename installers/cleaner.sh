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

# .DS_Store files
clean_glob "$HOME"/Desktop/**/*/.DS_Store

# Temporary downloaded files with browsers
clean_glob "$HOME"/Library/Application\ Support/Chromium/Default/File\ System
clean_glob "$HOME"/Library/Application\ Support/Chromium/Profile\ [0-9]/File\ System
clean_glob "$HOME"/Library/Application\ Support/Google/Chrome/Default/File\ System
clean_glob "$HOME"/Library/Application\ Support/Google/Chrome/Profile\ [0-9]/File\ System
clean_glob "$HOME"/Library/Application\ Support/BraveSoftware/Brave-Browser/Default/File\ System
clean_glob "$HOME"/Library/Application\ Support/BraveSoftware/Brave-Browser/Profile\ [0-9]/File\ System

# Things related to pool (piscine)
clean_glob "$HOME"/Desktop/Piscine\ Rules\ *.mp4
clean_glob "$HOME"/Desktop/PLAY_ME.webloc

echo "Cleaning completed."
