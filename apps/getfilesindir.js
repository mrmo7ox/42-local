
const { exec } = require("child_process");



function getfilesindir(cmd, dir) {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) return reject(error.message);
            if (stderr) return reject(stderr);

            const lines = stdout.split("\n").filter((line) => line.trim() !== "");
            const result = [];

            lines.forEach((line) => {
                const parts = line.trim().split(/\s+/);
                if (parts[1] !== dir) {
                    result.push({
                        size: parts[0],
                        directory: parts[1],
                    });
                }
            });

            resolve(result);
        });
    });
}

module.exports = { getfilesindir };