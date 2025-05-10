settings="$HOME/.config/Code/User/settings.json"
INSERT='  "[c]": {\n    "editor.defaultFormatter": "keyhr.42-c-format"\n  },'

echo "Installing the c_formatter_42"

pip3 install --user c_formatter_42

flatpak run com.visualstudio.code --install-extension keyhr.42-c-format

if [ $? -eq 0 ]; then
  echo "Command succeeded"
else
    echo "Try to run using the code command"
    code --install-extension keyhr.42-c-format

    if [ $? -eq 0 ]; then
        echo "code command worked successfully"
    else
        echo "No VSCode on the system"
    fi
fi

if [ ! -f "$settings" ]; then
    echo -e "{\n$INSERT\n}" > "$settings"
else
    sed -i "1a$INSERT" "$settings"
fi