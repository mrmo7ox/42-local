const { app, BrowserWindow, ipcMain } = require("electron");
const { exec } = require("child_process");
var os = require('os');
var path = require('path');
const { error } = require("console");
const { stderr } = require("process");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
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

ipcMain.on("files", (event, arg) => {
  const os = require("os");
  const { exec } = require("child_process");

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
      console.log(result)
      event.reply("files-res", JSON.stringify(result, null, 2));
    });
  });
});

app.whenReady().then(() => {
  createWindow();
});
