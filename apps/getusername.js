const { exec } = require("child_process");

function username() {
    return new Promise((resolve, reject) => {
        let cmd = "getent passwd $USER | cut -d ':' -f 5 | cut -d ',' -f 1";

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(error.message);
                return;
            }

            if (stderr) {
                reject(stderr);
                return;
            }

            if (stdout) {
                resolve(stdout.trim());
            }
        });
    });
}

module.exports = { username };