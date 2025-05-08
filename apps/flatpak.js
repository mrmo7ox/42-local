const { exec, spawn } = require("child_process");
const os = require("os");
const fs = require("fs");
const { updateFile } = require("./bash");
const { copyFileIfExists, removeFile, removeFolder } = require("./utils");
const filePath = "./apps.json";
const { exec_update } = require('./bash')



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
        await exec_update('ln', event);

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
            removeFolder(`${targetPath}/app/${info.downloadUrl}`)
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