const { exec } = require('child_process');

function auto_cleaner(event) {
    return new Promise((resolve, reject) => {
        let cmd = "/tmp/installer/cleaner.sh";

        const process = exec(cmd);

        process.stdout.on('data', (data) => {
            const output = data.toString().trim();
            console.log(output);
            if (output) {
                event.reply("update-me", output);
            }
        });

        process.stderr.on('data', (data) => {
            const error = data.toString().trim();
            console.log(error)
            if (error) {
                event.reply("update-me", error);
            }
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve('Cleaning finished successfully.');
                event.reply("auto_clean_res", 'done');
            } else {
                reject(`Process exited with code: ${code}`);
            }
        });
    });
}


module.exports = { auto_cleaner };