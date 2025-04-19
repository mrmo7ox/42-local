const { app, BrowserWindow, ipcMain, Menu, globalShortcut, dialog } = require("electron");
const { exec } = require("child_process");
var os = require('os');
var path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

log.transports.file.level = 'info';
autoUpdater.logger = log;
autoUpdater.autoDownload = true;

let mainWindow;

const createWindow = () => {
  Menu.setApplicationMenu(null);
  mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    icon: path.join(__dirname, '/src/icons/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  globalShortcut.register('f12', () => {
    if (mainWindow) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.loadFile("index.html");

  mainWindow.webContents.on('did-finish-load', () => {
    log.info('App loaded, checking for updates...');
    autoUpdater.checkForUpdatesAndNotify();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

function addtodesktop()
{
  if (process.platform !== 'linux') {
      log.info('Skipping .desktop file creation on non-Linux platform.');
      return;
  }

  const homeDir = os.homedir();
  const appDir = path.join(homeDir, '.local', 'share', 'applications');
  const file = path.join(appDir, '42-local.desktop');
  let exec_path = process.execPath;

  fs.mkdirSync(appDir, { recursive: true });

  if (fs.existsSync(file)) {
    log.info(`Desktop file exists: ${file}`);
    const existingContent = fs.readFileSync(file, 'utf-8');
    if (!existingContent.includes(`Exec=${exec_path}`)) {
        log.info(`Updating Exec path in ${file}`);
        const content = `[Desktop Entry]\nName=42-local\nComment=Install without sudo and clean your local\nExec=${exec_path}\nIcon=${path.join(__dirname, '/src/icons/icon.png')}\nType=Application\nTerminal=false\nCategories=Utility;`;
        fs.writeFileSync(file, content);
    }
  } else {
    log.info(`Creating desktop file: ${file}`);
    const content = `[Desktop Entry]\nName=42-local\nComment=Install without sudo and clean your local\nExec=${exec_path}\nIcon=${path.join(__dirname, '/src/icons/icon.png')}\nType=Application\nTerminal=false\nCategories=Utility;`;
    fs.writeFile(file, content, (err) => {
      if (err) {
        log.error('An error occurred writing the .desktop file:', err);
        return;
      }
      log.info('.desktop file written successfully!');
    });
  }
}

function removeFolder(folderPath) {
  try {
      fs.rmSync(folderPath, { recursive: true, force: true });
      log.info(`Folder removed: ${folderPath}`);
  } catch (err) {
      log.error(`Error removing folder ${folderPath}: ${err.message}`);
  }
}

ipcMain.on("user-name", (event, arg) => {
  let cmd = "getent passwd $USER | cut -d ':' -f 5 | cut -d ',' -f 1";

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      log.error(`user-name exec error: ${error.message}`);
      event.reply("user-name", `Error: ${error.message}`);
      return;
    }
    if (stderr) {
      log.error(`user-name stderr: ${stderr}`);
      event.reply("user-name", `Stderr: ${stderr}`);
      return;
    }
    event.reply("user-name", `${stdout.trim()}`);
  });
});

ipcMain.on("auto_clean", (event, arg) => {
  const homeDir = os.homedir();
  let cache_dir = path.join(homeDir, '.cache');
  removeFolder(cache_dir);
  event.reply("auto_clean_res", 'done');
});

ipcMain.on("clean_with_list", (event, arg) => {
  try {
    let folders = JSON.parse(arg);
    if (Array.isArray(folders)) {
        folders.forEach(folder => {
            if (typeof folder === 'string' && folder.trim() !== '') {
                removeFolder(folder.trim());
            } else {
                log.warn('Invalid folder path received in clean_with_list:', folder);
            }
        });
        event.reply("clean_with_list_res", 'done');
    } else {
        log.error('Invalid data received for clean_with_list. Expected an array.');
        event.reply("clean_with_list_res", 'error: Invalid data format');
    }
  } catch (e) {
      log.error('Error parsing JSON for clean_with_list:', e);
      event.reply("clean_with_list_res", 'error: Failed to parse folder list');
  }
});


ipcMain.on("files", (event, arg) => {
  const homeDir = os.homedir();
  const appDirectory = path.join(homeDir, '.var', 'app');
  const varDirectory = path.join(homeDir, '.var');
  const mainDirectory = homeDir;

  const getDirectorySizes = (cmd, excludePaths, callback) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      if (error) {
        log.error(`files exec error (${cmd}): ${error.message}`);
        return callback(error, null);
      }
      if (stderr) {
        log.warn(`files stderr (${cmd}): ${stderr}`);
      }

      const lines = stdout.split("\n").filter((line) => line.trim() !== "");
      const results = [];
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const size = parts[0];
          const directory = parts[1];
          if (!excludePaths.some(exclude => directory === exclude || directory.startsWith(exclude + path.sep))) {
            results.push({ size: size, directory: directory });
          }
        }
      });
      callback(null, results);
    });
  };

  let cmdApp = `du "${appDirectory}" --max-depth=1 --block-size=M | sort -nr`;
  let cmdMain = `du "${mainDirectory}" --max-depth=1 --block-size=M | sort -nr`;

  let combinedResults = [];
  let errors = [];

  let appCmdDone = false;
  let mainCmdDone = false;

  const checkCompletion = () => {
    if (appCmdDone && mainCmdDone) {
      if (errors.length > 0) {
        event.reply("files-res", `Errors encountered: ${errors.join(', ')}`);
      } else {
        combinedResults.sort((a, b) => parseInt(b.size) - parseInt(a.size));
        event.reply("files-res", JSON.stringify(combinedResults, null, 2));
      }
    }
  };

  getDirectorySizes(cmdApp, [appDirectory], (err, results) => {
    if (err) errors.push(`App Scan Error: ${err.message}`);
    if (results) combinedResults = combinedResults.concat(results);
    appCmdDone = true;
    checkCompletion();
  });

  getDirectorySizes(cmdMain, [mainDirectory, appDirectory, varDirectory], (err, results) => {
    if (err) errors.push(`Main Scan Error: ${err.message}`);
    if (results) combinedResults = combinedResults.concat(results);
    mainCmdDone = true;
    checkCompletion();
  });
});


function getDiskSpaceForDevice(devicePathPart, callback) {
  exec(`df -m`, (error, stdout, stderr) => {
    if (error) {
      log.error(`Error fetching disk space with df: ${error.message}`);
      return callback(null);
    }
    if (stderr) {
      log.warn(`df stderr: ${stderr}`);
    }

    const lines = stdout.trim().split('\n');
    const header = lines.shift();
    let foundInfo = null;

    lines.forEach(line => {
      const columns = line.trim().split(/\s+/);
      if (columns.length >= 6 && (columns[0].includes(devicePathPart) || columns[5] === devicePathPart || (devicePathPart === '/' && columns[5] === '/'))) {
        foundInfo = {
          filesystem: columns[0],
          size: columns[1],
          used: columns[2],
          available: columns[3],
          usagePercentage: columns[4],
          mountedOn: columns[5],
        };
        if (devicePathPart === '/' && columns[5] === '/') return;
        if (columns[0].includes(devicePathPart)) return;
      }
    });

    if (foundInfo) {
      callback(foundInfo);
    } else {
      log.warn(`No disk space information found for device containing: ${devicePathPart}`);
      callback(null);
    }
  });
}

ipcMain.on("storage", (event, arg) => {
  getDiskSpaceForDevice("/", (info) => {
    if (info) {
      log.info('Storage info:', info);
      event.reply("storage-res", info);
    } else {
      event.reply("storage-res", { error: "No information found for root device (/). Check logs." });
    }
  });
});

function sendStatusToWindow(text) {
  if (mainWindow) {
    log.info(text);
    mainWindow.webContents.send('update-message', text);
  } else {
    log.info(`Update status (no window): ${text}`);
  }
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  sendStatusToWindow(`Update available: v${info.version}.`);
});

autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('You have the latest version.');
});

autoUpdater.on('error', (err) => {
  sendStatusToWindow(`Update error: ${err.message}`);
  log.error('Update error:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = `Download speed: ${Math.round(progressObj.bytesPerSecond / 1024)} KB/s`;
  log_message += ` - Downloaded ${progressObj.percent.toFixed(2)}%`;
  log_message += ` (${Math.round(progressObj.transferred / (1024*1024))}MB / ${Math.round(progressObj.total / (1024*1024))}MB)`;
  sendStatusToWindow(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow(`Update downloaded: v${info.version}. Restart the application to apply the update.`);
  log.info('Update downloaded; will install on quit');
  if (mainWindow) {
    mainWindow.webContents.send('update-ready');
  }
});

ipcMain.on('quit-and-install', (event, arg) => {
  log.info('Received quit-and-install signal from renderer.');
  autoUpdater.quitAndInstall();
});

ipcMain.handle('app-version', () => {
  log.info(`Providing app version: ${app.getVersion()}`);
  return app.getVersion();
});

app.whenReady().then(() => {
  log.info('App is ready.');
  addtodesktop();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});