const { exec, spawn } = require("child_process");
const os = require("os");
const fs = require("fs");
const { updateFile } = require("./vscode");
const { copyFileIfExists, removeFile } = require("./utils");
const filePath = "./apps.json";

function addflathub() {
  return new Promise((resolve, reject) => {
    const flathubCommand =
      "flatpak remote-add --user --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo";

    exec(flathubCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${flathubCommand}\n${error.message}`);
        return reject(error);
      }
      console.log(`Flathub added successfully: ${stdout}`);
      resolve(stdout);
    });
  });
}

function addln() {
  const homeDir = os.homedir();
  const user = os.userInfo();
  console.log(user)
  console.log(`User Home Directory: ${homeDir}`);

  return new Promise((resolve, reject) => {
    try {
      const symlinkPath = `${homeDir}/.local/share/flatpak`;
      const targetPath = `/goinfre/${user.username}/flatpak`;

      if (fs.existsSync(symlinkPath)) {
        const stats = fs.lstatSync(symlinkPath);

        if (stats.isSymbolicLink()) {
          const realPath = fs.realpathSync(symlinkPath);
          console.log(realPath);
          if (realPath === targetPath) {
            console.log(`Symlink already exists and points to the correct path: ${symlinkPath} -> ${realPath}`);
            return resolve("Symlink already exists and is correct");
          } else {
            console.log(`Symlink exists but points to a different path: ${symlinkPath} -> ${realPath}`);
            fs.unlinkSync(symlinkPath);
          }
        } else if (stats.isDirectory()) {
          console.log(`'${symlinkPath}' is a directory. Removing it.`);
          fs.rmSync(symlinkPath, { recursive: true, force: true });
        } else {
          console.log(`'${symlinkPath}' is a file. Removing it.`);
          fs.unlinkSync(symlinkPath);
        }
      }

      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
        console.log(`Removed existing target directory: ${targetPath}`);
      }

      fs.mkdirSync(targetPath, { recursive: true });
      console.log(`Created target directory: ${targetPath}`);

      const cmd = `ln -s ${targetPath} ${symlinkPath}`;
      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing command: ${cmd}\n${error.message}`);
          return reject(error);
        }
        console.log(`Symbolic link created: ${stdout}`);
        resolve(stdout);
      });
    } catch (err) {
      console.error(`Error in addln function: ${err.message}`);
      reject(err);
    }
  });
}

function flatpak(action, info, event) {
  return new Promise(async (resolve, reject) => {
    try {
      const home = os.homedir();
      const user = os.userInfo();
      const targetPath = `/goinfre/${user.username}/flatpak`;
      const desktop = `${targetPath}/exports/share/applications/${info.downloadUrl}.desktop`;
      const localDesktop = `${home}/.local/share/applications/${info.downloadUrl}.desktop`;

      if (action === "install") {
        console.log("Starting Flatpak installation...");
        await addln();
        await addflathub();

        const command = ["install", "--user", "flathub", info.downloadUrl, "-y"];
        const proc = spawn("flatpak", command);

        proc.stdout.on("data", (data) => {
          const output = data.toString().trim();
          if (output) {
            console.log(output);
            event.reply("update-me", output);
          }
        });

        proc.stderr.on("data", (data) => {
          const error = data.toString().trim();
          if (error) {
            console.error(error);
            event.reply("update-me", error);
          }
        });

        proc.on("close", (code) => {
          if (code === 0) {
            event.reply("auto_clean_res", "done");
            updateFile(info.id, "no", filePath);
            copyFileIfExists(desktop, localDesktop);
            resolve("Flatpak installation complete.");
          } else {
            reject(new Error(`Install exited with code: ${code}`));
          }
        });

      } else if (action === "uninstall") {
        console.log("Starting Flatpak uninstallation...");
        await addflathub();

        removeFile(localDesktop);

        const command = ["uninstall", "--user", "flathub", info.downloadUrl, "-y"];
        const proc = spawn("flatpak", command);

        proc.stdout.on("data", (data) => {
          const output = data.toString().trim();
          if (output) {
            console.log(output);
            event.reply("update-me", output);
          }
        });

        proc.stderr.on("data", (data) => {
          const error = data.toString().trim();
          if (error) {
            console.error(error);
            event.reply("update-me", error);
          }
        });

        proc.on("close", (code) => {
          if (code === 0) {
            updateFile(info.id, "no", filePath);
            resolve("Flatpak uninstalled successfully.");
          } else {
            reject(new Error(`Uninstall exited with code: ${code}`));
          }
        });

      } else {
        reject(new Error("Invalid action specified. Use 'install' or 'uninstall'."));
      }
    } catch (err) {
      console.error(`Error in flatpak function: ${err.message}`);
      reject(err);
    }
  });
}
module.exports = { flatpak };