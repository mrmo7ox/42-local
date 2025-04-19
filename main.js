const { app, BrowserWindow, ipcMain} = require("electron");
const { exec } = require("child_process");
var os = require('os');
var path = require('path');
const fs = require('fs');
const { json } = require("stream/consumers");
const { Menu, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = require("electron-log");


autoUpdater.autoDownload  = true;
autoUpdater.autoInstallOnAppQuit  = true;
autoUpdater.logger.transports.file.level = "info";
addtodesktop();

const createWindow = () => {
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    icon: path.join(__dirname, '/src/icons/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  globalShortcut.register('f12', () => {
    if (win) {
      win.webContents.toggleDevTools();
    }
  });
  
  win.loadFile("index.html");

};

function addtodesktop()
{
  const homeDir = os.homedir();

  const file = `${homeDir}/.local/share/applications/42-local.desktop`
  const exec_path = app.getAppPath()
  if (fs.existsSync(file)) {
    console.log(`File exists: ${file}`);
  } else {
    const content = `[Desktop Entry]\nName=42-local\nComment=Install without sudo and clean your local\nExec=${exec_path}\nType=Application\nTerminal=false`;
    fs.writeFile(file, content, (err) => {
      if (err) {
        console.error('An error occurred writing the file:', err);
        return;
      }
      console.log('File written successfully!');
    });
  }
}

function removeFolder(folderPath) {
  try {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`Folder removed: ${folderPath}`);
  } catch (err) {
      console.error(`Error removing folder: ${err.message}`);
  }
}


ipcMain.on("user-name", (event, arg) => {
  let cmd = "getent passwd $USER | cut -d ':' -f 5 | cut -d ',' -f 1";

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      event.reply("user-name", `Error: ${error.message}`);
      return;
    }

    if (stderr) {
      const readableStderr =
        typeof stderr === "object" ? JSON.stringify(stderr, null, 2) : stderr;
      event.reply("user-name", `Stderr: ${readableStderr}`);
      return;
    }

    event.reply("user-name", `${stdout}`);
  });
});

ipcMain.on("auto_clean", (event, arg) => {
  const homeDir = os.homedir();
  let   cache_dir = `${homeDir}/.cache`;
  let   trash = `${homeDir}/.trash`;
  removeFolder(cache_dir)
  removeFolder(cache_dir)
  event.reply("auto_clean_res", 'done');
 
});

ipcMain.on("clean_with_list", (event, arg) => {
  let folder = JSON.parse(arg)
  folder.map(folder =>{
    removeFolder(folder);
  });
  event.reply("clean_with_list_res", 'done');
});

ipcMain.on("files", (event, arg) => {

  const homeDir = os.homedir();
  const appDirectory = `${homeDir}/.var/app/`;
  const varDirectory = `${homeDir}/.var`;
  const mainDirectory = homeDir;

  let cmdApp = `du ${appDirectory} --max-depth=1 --block-size=M | sort -nr`;
  let cmdMain = `du ${mainDirectory} --max-depth=1 --block-size=M | sort -nr`;

  const result = [];

  exec(cmdApp, (error, stdout, stderr) => {
    if (error) {
      event.reply("files-res", `Error: ${error.message}`);
      return;
    }

    if (stderr) {
      event.reply("files-res", `Stderr: ${stderr}`);
      return;
    }

    const lines = stdout.split("\n").filter((line) => line.trim() !== "");
    lines.forEach((line) => {
      const parts = line.trim().split(/\s+/);
      if (parts[1] !== appDirectory) {
        result.push({
          size: parts[0],
          directory: parts[1],
        });
      }
    });

    exec(cmdMain, (error, stdout, stderr) => {
      if (error) {
        event.reply("files-res", `Error: ${error.message}`);
        return;
      }

      if (stderr) {
        event.reply("files-res", `Stderr: ${stderr}`);
        return;
      }

      const lines = stdout.split("\n").filter((line) => line.trim() !== "");
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const directory = parts[1];

        if (directory !== appDirectory && directory !== `${mainDirectory}` && varDirectory !== directory) {
          result.push({
            size: parts[0],
            directory: directory,
          });
        }
      });
      event.reply("files-res", JSON.stringify(result, null, 2));
    });
  });
});


function getDiskSpaceForDevice(device, callback) {
  exec(`df -m | grep ${device}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error fetching disk space: ${error.message}`);
      callback(null);
      return;
    }

    if (stderr) {
      console.error(`Standard error: ${stderr}`);
      callback(null);
      return;
    }

    const columns = stdout.trim().split(/\s+/);

    if (columns.length >= 6) {
      const info = {
        filesystem: columns[0],
        size: columns[1],
        used: columns[2],
        available: columns[3],
        usagePercentage: columns[4],
        mountedOn: columns[5],
      };
      callback(info);
    } else {
      console.log(`No information found for device: ${device}`);
      callback(null);
    }
  });
}

ipcMain.on("storage", (event, arg) => {
  getDiskSpaceForDevice("/dev/sdb", (info) => {
    if (info) {
      console.log(info);
      event.reply("storage-res", info);
    } else {
      event.reply("storage-res", { error: "No information found for device." });
    }
  });
});



function downloadAndExtractVSCodeExec(name, appdir, icon, downloadUrl, installDir, tmpFile, binaryPath, alias, callback) {
  const command = `
  APP="${appdir}"
  DESKTOPNAME="${name}.desktop"
  NAME="${name}"
  TARGET_DIR="${installDir}"
  DOWNLOAD_TMP="${tmpFile}"
  DOWNLOAD_URL="${downloadUrl}"
  CODEDIR="${binaryPath}"
  TEXT="[Desktop Entry]\nName=$NAME\nComment=$NAME\nExec=$CODEDIR\nIcon=${icon}\nType=Application\nTerminal=false\nCategories=Utility;"
  
  mkdir -p "$DOWNLOAD_DIR"
  mkdir -p "$TARGET_DIR"
  mkdir -p "$APP"

  curl -L -s -S -o "$DOWNLOAD_TMP" "$DOWNLOAD_URL"

  if [ -f "$DOWNLOAD_TMP" ]; then
    tar -xzvf "$DOWNLOAD_TMP" -C "$TARGET_DIR" --strip-components=1
    rm -f "$DOWNLOAD_TMP"
    chmod +x "$CODEDIR"

    if ! grep -Fxq "alias ${alias}='$CODEDIR'" ~/.zshrc; then
      echo "alias ${alias}='$CODEDIR'" >> ~/.zshrc
    fi

    if ! grep -Fxq "alias ${alias}='$CODEDIR'" ~/.bashrc; then
      echo "alias ${alias}='$CODEDIR'" >> ~/.bashrc
    fi

    echo -e "$TEXT" > "$APP/$DESKTOPNAME"
    chmod +x "$APP/$DESKTOPNAME"
  else
    echo "Error: Downloaded file not found" >&2
    exit 1
  fi
  `;

  exec(command, (error, stdout, stderr) => {
    if (stderr) {
      console.error(`stderr:\n${stderr}`);
    }

    if (error) {
      console.error(`exec error: ${error}`);
      if (callback) callback(error, stdout);
      return;
    }

    console.log(`stdout:\n${stdout}`);

    if (callback) callback(null, stdout);
  });
}

downloadAndExtractVSCodeExec((err, output) => {
  if (err) {
    console.error("\n--- Operation Failed ---");
  } else {
    console.log("\n--- Operation Completed Successfully ---");
  }
});
















app.whenReady().then(() => {
  createWindow();

  autoUpdater.checkForUpdates();
  autoUpdater.on('update-available', (_info) => {
    console.log('Update available.');
});

autoUpdater.on('update-not-available', (_info) => {
    console.log('Update not available.');
});

autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    console.log(log_message);
});

autoUpdater.on('update-downloaded', (_info) => {
    console.log('Update downloaded');});

});
