const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function download_instaler() {
    const li = {
        "/tmp/installer/ln.sh": "https://raw.githubusercontent.com/mrmo7ox/42-local/master/installers/ln.sh",
        "/tmp/installer/burpsuite.sh": "https://raw.githubusercontent.com/mrmo7ox/42-local/master/installers/burpsuite.sh",
        "/tmp/installer/ft_lock.sh": "https://raw.githubusercontent.com/mrmo7ox/42-local/master/installers/ft_lock.sh",
        "/tmp/installer/norm.sh": "https://raw.githubusercontent.com/mrmo7ox/42-local/master/installers/norm.sh",
        "/tmp/installer/zsh.sh": "https://raw.githubusercontent.com/mrmo7ox/42-local/master/installers/zsh.sh",
        "/tmp/installer/vscode.sh": "https://raw.githubusercontent.com/mrmo7ox/42-local/master/installers/vscode.sh",
        "/tmp/installer/nvm.sh": "https://raw.githubusercontent.com/mrmo7ox/42-local/master/installers/nvm.sh",
        "/tmp/installer/cleaner.sh": "https://raw.githubusercontent.com/mrmo7ox/42-local/master/installers/cleaner.sh",
    };
    const dir = "/tmp/installer";
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const downloadPromises = Object.entries(li).map(([key, url]) => {
        return new Promise((resolve, reject) => {
            exec(`curl -o ${key} ${url}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error downloading ${url}: ${error.message}`);
                    reject(error);
                    return;
                }
                if (stderr) {
                    console.error(`stderr while downloading ${url}: ${stderr}`);
                }
                resolve(stdout);
            });
        });
    });

    return Promise.all(downloadPromises);
}

function chmodAllScripts(directory) {
    return new Promise(async (resolve, reject) => {
        try {
            await download_instaler();

            fs.readdir(directory, (err, files) => {
                if (err) {
                    reject(`Error reading directory: ${err}`);
                    return;
                }

                let chmodPromises = files.map(file => {
                    let filePath = path.join(directory, file);

                    return new Promise((fileResolve, fileReject) => {
                        fs.stat(filePath, (err, stats) => {
                            if (err) {
                                fileReject(`Error checking file stats: ${err}`);
                                return;
                            }

                            if (stats.isFile()) {
                                console.log(`Changing permissions for: ${filePath}`);
                                exec(`chmod +x ${filePath}`, (error, stdout, stderr) => {
                                    if (error) {
                                        fileReject(`Error changing permissions for ${filePath}: ${error.message}`);
                                        return;
                                    }
                                    if (stderr) {
                                        console.warn(`stderr for ${filePath}: ${stderr}`);
                                    }
                                    fileResolve(stdout);
                                });
                            } else {
                                fileResolve();
                            }
                        });
                    });
                });

                Promise.all(chmodPromises)
                    .then(() => resolve('All scripts have been updated with execute permissions.'))
                    .catch(reject);
            });
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = { chmodAllScripts };
