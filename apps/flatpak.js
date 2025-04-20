const { exec } = require("child_process");
const os = require("os");
const fs = require("fs");
const { updateFile } = require("./vscode");
const filePath = "./apps.json";

// Function to add Flathub remote
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

// Function to manage and create symbolic links
function addln() {
  const homeDir = os.homedir();
  console.log(`User Home Directory: ${homeDir}`);

  return new Promise((resolve, reject) => {
    try {
      const symlinkPath = `${homeDir}/.local/share/flatpak`;
      const targetPath = `${homeDir}/goinfre/flatpak`;

      // Check if the symbolic link exists
      if (fs.existsSync(symlinkPath)) {
        const stats = fs.lstatSync(symlinkPath);

        if (stats.isSymbolicLink()) {
          const realPath = fs.realpathSync(symlinkPath);
          if (realPath === targetPath) {
            console.log(`Symlink already exists and points to the correct path: ${symlinkPath} -> ${realPath}`);
            return resolve("Symlink already exists and is correct");
          } else {
            console.log(`Symlink exists but points to a different path: ${symlinkPath} -> ${realPath}`);
            fs.unlinkSync(symlinkPath); // Remove incorrect symbolic link
          }
        } else if (stats.isDirectory()) {
          console.log(`'${symlinkPath}' is a directory. Removing it.`);
          fs.rmSync(symlinkPath, { recursive: true, force: true }); // Remove the directory
        } else {
          console.log(`'${symlinkPath}' is a file. Removing it.`);
          fs.unlinkSync(symlinkPath); // Remove the file
        }
      }

      // Remove the target directory if it exists
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
        console.log(`Removed existing target directory: ${targetPath}`);
      }

      // Create the target directory
      fs.mkdirSync(targetPath, { recursive: true });
      console.log(`Created target directory: ${targetPath}`);

      // Create the symbolic link
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

// Function to handle Flatpak operations (install/uninstall)
function flatpak(action, info) {
  return new Promise(async (resolve, reject) => {
    try {
      if (action === "install") {
        console.log("Starting Flatpak installation...");
        await addln(); // Ensure symlink exists
        await addflathub(); // Ensure Flathub remote is added

        const command = `flatpak install --user flathub ${info.downloadUrl} -y`;
        console.log(`Executing command: ${command}`);

        const process = exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing command: ${command}\n${error.message}`);
            return reject(error);
          }
          console.log(`Flatpak installed successfully: ${stdout}`);
          resolve(stdout);
        });

        // Stream real-time output
        process.stdout.on("data", (data) => {
          console.log(`STDOUT: ${data}`);
        });

        process.stderr.on("data", (data) => {
          console.error(`STDERR: ${data}`);
        });

        // Update apps.json after successful installation
        process.on("close", (code) => {
          if (code === 0) {
            updateFile(info.id, "yes", filePath);
          }
        });
      } else if (action === "uninstall") {
        console.log("Starting Flatpak uninstallation...");
        await addflathub(); // Ensure Flathub remote is added

        const command = `flatpak uninstall --user flathub ${info.downloadUrl} -y`;
        console.log(`Executing command: ${command}`);

        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing command: ${command}\n${error.message}`);
            return reject(error);
          }
          console.log(`Flatpak uninstalled successfully: ${stdout}`);
          resolve(stdout);

          // Update apps.json after successful uninstallation
          updateFile(info.id, "no", filePath);
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