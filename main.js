const { app, BrowserWindow, ipcMain} = require("electron");
const { exec } = require("child_process");
var os = require('os');
var path = require('path');
const fs = require('fs');
const { Menu, globalShortcut } = require('electron');
const { autoUpdater } = require('electron-updater');
const {vscode} = require('./apps/vscode')
const {getDiskSpaceForDevice, readJsonFile, removeFolder} = require('./apps/utils')
const {zsh} = require('./apps/zsh')
autoUpdater.logger = require("electron-log");
const {flatpak} = require('./apps/flatpak')
const {get_file_check, installed_or_not} = require('./apps/filechecker')
let  jsonData;
const filePath = '/tmp/apps.json';

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




ipcMain.on("storage", (event, arg) => {
  getDiskSpaceForDevice("/dev/sdb", (info) => {
    if (info) {
      event.reply("storage-res", info);
    } else {
      event.reply("storage-res", { error: "No information found for device." });
    }
  });
});



ipcMain.on('apps-installer', async (event, arg) => {
  try {
    const info = JSON.parse(arg);
    if (info.id === 'vscode') {
      if(info.st === 'no')
      {
        await vscode('install', info);
        event.reply('apps-installer-res', 'done');
      }
      else if(info.st === 'yes')
      {
        await vscode('uninstall', info);
        event.reply('apps-installer-res', 'done');
      }
    } else if (info.id === 'zsh') {
      if(info.st === 'no')
        {
          await zsh('install', info)
          .then(()=>
          {
            event.reply('apps-installer-res', 'done');
          })
          .catch((err)=>{
            console.log(err);
          })

        }
        else if(info.st === 'yes')
        {
          await zsh('uninstall', info)
          .then(()=>
          {
            event.reply('apps-installer-res', 'done');
          })
          .catch((err)=>{
            console.log(err);
          })
          
        }
    }
    else if(info.installDir === 'flatpak')
    {
      if(info.st === 'no')
        {
          await flatpak('install', info)
          .then(()=>
            {
              
              console.log("test")
            event.reply('apps-installer-res', 'done');
          })
          .catch((err)=>{
            console.log(err);
          })

        }
        else if(info.st === 'yes')
        {
          await flatpak('uninstall', info)
          .then(()=>
          {
            event.reply('apps-installer-res', 'done');
          })
          .catch((err)=>{
            console.log(err);
          })
          
        }
    }
  } catch (err) {
    console.error(`Error handling IPC event: ${err.message}`);
  }
});


ipcMain.on("apps", async (event, arg) => {
  const filePath = path.join("/", "tmp", "apps.json");

  try {
      await get_file_check();
      await installed_or_not();
      fs.readFile(filePath, "utf8", (err, data) => {
          if (err) {
              event.reply(
                  "apps-res",
                  JSON.stringify({ error: err.message }, null, 2)
              );
          } else {
              const result = JSON.parse(data);
              event.reply("apps-res", JSON.stringify(result, null, 2));
          }
      });
  } catch (error) {
      event.reply(
          "apps-res",
          JSON.stringify({ error: error.message }, null, 2)
      );
  }
});


function addtodesktop()
{
  const homeDir = os.homedir();

  const file = `${homeDir}/.local/share/applications/42-local.desktop`
  const exec_path = app.getAppPath()
  if (fs.existsSync(file)) {
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
