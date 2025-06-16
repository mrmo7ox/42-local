const fs = require('fs');
const { exec } = require('child_process');





function updateFile(name, n_status, filePath) {
  try {
    let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    content.forEach((item) => {
      if (item[name]) {
        item[name].status = n_status;
      }
    });
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error updating file: ${err.message}`);
  }
}


function bash_installer(mode, event, info) {
  return new Promise((resolve, reject) => {
    let cmd = `/tmp/installer/${info.id}.sh`;
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
        resolve('installing finished successfully.');
      } else {
        reject(`Process exited with code: ${code}`);
      }
    });

  });
}

function exec_update(cmd_file, event) {
  return new Promise((resolve, reject) => {
    let cmd = `/tmp/installer/${cmd_file}.sh`;
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
        resolve('installing finished successfully.');
      } else {
        reject(`Process exited with code: ${code}`);
      }
    });

  });
}



module.exports = { exec_update, bash_installer, updateFile };