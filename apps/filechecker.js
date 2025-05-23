const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { updateFile } = require('./bash')

async function installed_or_not() {
    const flatpakDir = path.join(os.homedir(), "goinfre/flatpak/app");
    const vscodeDir = path.join(os.homedir(), ".var/app/vscode_stable");
    const burpdir = path.join(os.homedir(), ".burp");
    console.log(fs.existsSync(flatpakDir));
    const jsonFilePath = "/tmp/apps.json";

    try {
        const data = await fs.promises.readFile(jsonFilePath, "utf8");
        const result = JSON.parse(data);
        // hadi lvscode safii 
        for (const item of result) {
            for (const key of Object.keys(item)) {
                if (key === "vscode") {
                    const status = fs.existsSync(vscodeDir) ? "yes" : "no";
                    updateFile(key, status, jsonFilePath);
                    break;
                }
                if (key === "burpsuite") {
                    const status = fs.existsSync(burpdir) ? "yes" : "no";
                    updateFile(key, status, jsonFilePath);
                    break;
                }
            }
        }
        if (fs.existsSync(flatpakDir)) {
            const folders = await fs.promises.readdir(flatpakDir);
            if (folders.length === 0) {
                for (const item of result) {
                    for (const key of Object.keys(item)) {
                        if (key !== "zsh" && key !== "vscode") {
                            updateFile(key, "no", jsonFilePath);
                        }
                    }
                }
            }

            else {
                for (const folder of folders) {
                    for (const item of result) {
                        for (const key of Object.keys(item)) {
                            if (item[key]["type"] === "bash") {
                                continue;
                            }
                            else if (item[key]["type"] === "flatpak" && item[key]["downloadUrl"] === folder) {
                                updateFile(key, "yes", jsonFilePath);
                            } else if (item[key]["type"] === "flatpak" && item[key]["downloadUrl"] !== folder) {
                                updateFile(key, "no", jsonFilePath);
                            }
                        }
                    }
                }
                return "Operation completed successfully";
            }
        } else {
            return "Flatpak directory does not exist";
        }
    } catch (err) {
        throw new Error(err.message.includes("ENOENT") ? "File not found or cannot be read" : err.message);
    }
}

async function get_file_check() {
    return new Promise((resolve, reject) => {
        const filePath = path.join("/", "tmp", "apps.json");
        const url = "https://raw.githubusercontent.com/mrmo7ox/42-local/master/apps.json";

        const cmd = `curl -o "${filePath}" ${url}`;
        console.log("Downloading file...");
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error("Error occurred while downloading the file:", error);
                reject(error);
                return;
            }

            if (stderr) {
                console.error("Curl stderr output:", stderr);
            }

            console.log("File downloaded successfully to:", filePath);
            resolve();
        });


    });
}



module.exports = { get_file_check, installed_or_not }
