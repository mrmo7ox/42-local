const { check_token } = require("./server");
const { app, BrowserWindow, ipcMain, globalShortcut } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { Menu } = require("electron");
const { bash_installer } = require("./apps/bash");
const { getDiskSpaceForDevice, readJsonFile, removeFolder } = require("./apps/utils");
const { flatpak } = require("./apps/flatpak");
const { get_file_check, installed_or_not } = require("./apps/filechecker");
const { add_short } = require("./apps/short-cut");
const { username } = require("./apps/getusername");
const { auto_cleaner } = require("./apps/cleaner");
const { chmodAllScripts } = require("./apps/chmod");
const { getfilesindir } = require("./apps/getfilesindir");

const createWindow = () => {
  chmodAllScripts("/tmp/installer/");
  Menu.setApplicationMenu(null);
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    icon: path.join(__dirname, "/src/icons/icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const registered = globalShortcut.register("f12", () => {
    if (win) {
      win.webContents.toggleDevTools();
    }
  });

  // if (!registered) {
  //   console.error("Global shortcut registration failed");
  // }

  win.loadFile("index.html");
};

ipcMain.on("user-name", (event, arg) => {
  username()
    .then(name => {
      event.reply("user-name", name)
    })
    .catch(err => console.error('Error:', err));
});

ipcMain.on("auto_clean", (event, arg) => {
  auto_cleaner(event).catch((error) => {
    event.reply("auto_clean_res", error);
  });
});

ipcMain.on("clean_with_list", (event, arg) => {
  let folder = JSON.parse(arg)
  folder.map(folder => {
    removeFolder(folder);
  });
  event.reply("clean_with_list_res", 'done');
});

ipcMain.on("files", async (event, arg) => {
  const homeDir = os.homedir();
  const var_dir = `${homeDir}/.var/app/`;
  const cache = `${homeDir}/.cache`;

  let cmd_homeDir = `du ${homeDir} --max-depth=1 --block-size=M | sort -nr`;
  let cmd_var_dir = `du ${var_dir} --max-depth=1 --block-size=M | sort -nr`;
  let cmd_cache = `du ${cache} --max-depth=1 --block-size=M | sort -nr`;

  try {
    const [resHome, resVar, resCache] = await Promise.all([
      getfilesindir(cmd_homeDir, homeDir),
      getfilesindir(cmd_var_dir, var_dir),
      getfilesindir(cmd_cache, cache),
    ]);

    const result = [...resHome, ...resVar, ...resCache];
    result.sort((a, b) => {
      const sizeA = parseInt(a.size.replace(/[^0-9]/g, ""), 10);
      const sizeB = parseInt(b.size.replace(/[^0-9]/g, ""), 10);
      return sizeB - sizeA;
    });
    event.reply("files-res", JSON.stringify(result, null, 2));
  } catch (err) {
    event.reply("files-res", { error: err });
  }
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
    if (info.type === "bash") {
      if (info.st === "no") {
        await bash_installer('install', event, info);
        event.reply('apps-installer-res', 'done');
      }
      else if (info.st === "yes") {
        await bash_installer('uninstall', event, info);
        event.reply('apps-installer-res', 'done');
      }
    }
    else if (info.type === "flatpak") {
      if (info.st === 'no') {
        await flatpak('install', info, event)
          .then(() => {
            event.reply('apps-installer-res', 'done');
          })
          .catch((err) => {
            console.log(err);
          })
      }
      else if (info.st === 'yes') {
        await flatpak('uninstall', info, event)
          .then(() => {
            event.reply('apps-installer-res', 'done');
          })
          .catch((err) => {
            console.log(err);
          })
      }
    }
  } catch (err) {
    event.reply('apps-installer-res', 'done');

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

ipcMain.on("profile", async (event, arg) => {
  try {
    const res = await check_token();
    console.log("Token is valid. Proceeding without showing the login window.");
    event.reply("profile-res", JSON.stringify(res));
  } catch (error) {
    console.error("Error fetching profile data:", error);
    event.reply("profile-res", JSON.stringify({ error: "Failed to fetch profile data" }));
  }
});

app.whenReady().then(() => {
  createWindow();
  add_short();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});