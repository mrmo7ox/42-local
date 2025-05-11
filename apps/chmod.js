const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function chmodAllScripts(directory) {
    return new Promise((resolve, reject) => {
        fs.readdir(directory, (err, files) => {
            if (err) {
                reject(`Error reading directory: ${err}`);
                return;
            }

            // Iterate through all the files in the directory
            let chmodPromises = files.map(file => {
                let filePath = path.join(directory, file);

                return new Promise((fileResolve, fileReject) => {
                    fs.stat(filePath, (err, stats) => {
                        if (err) {
                            fileReject(`Error checking file stats: ${err}`);
                            return;
                        }

                        // Only change permissions if it's a file (not a directory)
                        if (stats.isFile()) {
                            console.log(`Changing permissions for: ${filePath}`);
                            exec(`chmod +x ${filePath}`, (error, stdout, stderr) => {
                                if (error) {
                                    fileReject(`Error changing permissions for ${filePath}: ${error.message}`);
                                    return;
                                }
                                if (stderr) {
                                    fileReject(`stderr for ${filePath}: ${stderr}`);
                                    return;
                                }
                                fileResolve(stdout);  // Resolve the promise for this file
                            });
                        } else {
                            fileResolve();  // Resolve for non-file items (like directories)
                        }
                    });
                });
            });

            // Wait for all files to be processed
            Promise.all(chmodPromises)
                .then(() => resolve('All scripts have been updated with execute permissions.'))
                .catch(reject);
        });
    });
}

module.exports = { chmodAllScripts };
