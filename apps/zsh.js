const {exec} = require('child_process')
const {downloadFile} = require('./utils');
const {updateFile} = require('./vscode');
const os = require('os');
const filePath = '/tmp/apps.json';

function zsh(action, info) {
    return new Promise((resolve, reject) => {
        const homeDir = os.homedir();
        downloadFile(info.downloadUrl, info.installDir.replace('~', homeDir))
        .then(()=>{

        let command = `chmod +x ${info.installDir.replace('~', homeDir)}`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
            console.error(`Error executing command:${command}\n ${error.message}`);
            reject(error); 
            } else {
                command = `sh -s ${info.installDir.replace('~', homeDir)}`
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`2 Error executing command:${command}\n ${error.message}`);
                        reject(error); 
                    } else {
                        console.log(`Command output: ${stdout}`);
                        resolve(stdout); 
                    }
                });
                command = `rm -rf ${info.installDir.replace('~', homeDir)}`
                exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`2 Error executing command:${command}\n ${error.message}`);
                    reject(error); 
                } else {
                    console.log(`Command output: ${stdout}`);
                    resolve(stdout); 
                }
                });
                updateFile(info.id, 'yes', filePath);
            console.log(`Command output: ${stdout}`);
            resolve(stdout); 
            }
        });
    });
    });
}



module.exports = {zsh};