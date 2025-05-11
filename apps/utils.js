const fs = require('fs');
const { https, http } = require('follow-redirects');
const tar = require('tar');
const { exec } = require("child_process");

function downloadFile(url, outputFilePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        console.log(`Redirected to: ${redirectUrl}`);
        return resolve(downloadFile(redirectUrl, outputFilePath));
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download file. Status code: ${response.statusCode}`));
      }

      const fileStream = fs.createWriteStream(outputFilePath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close(() => {
          console.log(`Downloaded file saved to ${outputFilePath}`);
          resolve(true);
        });
      });

      fileStream.on('error', (err) => {
        reject(new Error(`Error writing file: ${err.message}`));
      });
    }).on('error', (err) => {
      reject(new Error(`Error downloading file: ${err.message}`));
    });
  });
}



async function extractTarFile(tarFilePath, outputDir) {
  try {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    await tar.x({
      file: tarFilePath,
      cwd: outputDir,
    });

    console.log(`Tar file extracted successfully to ${outputDir}`);
  } catch (err) {
    console.error(`Error extracting tar file: ${err.message}`);
  }

}

async function appendTextToFile(filePath, text) {
  await fs.appendFile(filePath, text, (err) => {
    if (err) {
      console.error(`Error appending to file: ${err.message}`);
      return (true);
    }
    console.log('Text appended successfully!');
  });
}

function creatTextToFile(filePath, text) {
  fs.writeFile(filePath, text, (err) => {
    if (err) {
      console.error(`Error writing to file: ${err.message}`);
      return;
    }
    console.log('File written successfully');
  });
}


async function findAndReplaceText(filePath, textToFind, replacementText) {
  fss = fs.promises;
  try {
    console.log(`Reading file: ${filePath}`);
    const fileContent = await fss.readFile(filePath, 'utf8');
    console.log(fileContent);
    const updatedContent = fileContent.replace(new RegExp(textToFind, 'g'), replacementText);

    await fss.writeFile(filePath, updatedContent, 'utf8');

    console.log(`Replaced all occurrences of "${textToFind}" with "${replacementText}"`);
  } catch (err) {
    console.error(`Error processing the file: ${err.message}`);
  }
}
function removeFolder(folderPath) {
  try {
    fs.rmSync(folderPath, { recursive: true, force: true });
    console.log(`Folder removed: ${folderPath}`);
  } catch (err) {
    console.error(`Error removing folder: ${err.message}`);
  }
}

function removeFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Error removing file: ${err.message}`);
      return;
    }
    console.log('File removed successfully');
  });
}


function readJsonFile(filePath, callback) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return callback(err, null);
    }

    try {
      const jsonData = JSON.parse(data);
      callback(null, jsonData);
    } catch (parseErr) {
      callback(parseErr, null);
    }
  });
}

function getDiskSpaceForDevice(device, callback) {
  exec(`df -m | grep /home/$USER`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error fetching disk space: ${error.message}`);
      callback(null);
      return;
    }

    if (stderr) {
      console.error(`Standard error: ${stderr}`);
      callback(null);
      return;
    }

    const columns = stdout.trim().split(/\s+/);

    if (columns.length >= 6) {
      const info = {
        filesystem: columns[0],
        size: columns[1],
        used: columns[2],
        available: columns[3],
        usagePercentage: columns[4],
        mountedOn: columns[5],
      };
      callback(info);
    } else {
      console.log(`No information found for device: ${device}`);
      callback(null);
    }
  });
}

function copyFileIfExists(source, destination) {
  fs.access(source, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`Source file "${source}" does not exist.`);
      return;
    }

    fs.copyFile(source, destination, (err) => {
      if (err) {
        console.error(`Error copying file: ${err}`);
      } else {
        console.log(`File copied successfully from "${source}" to "${destination}".`);
      }
    });
  });
}
module.exports = { copyFileIfExists, getDiskSpaceForDevice, readJsonFile, removeFolder, removeFile, extractTarFile, downloadFile, appendTextToFile, creatTextToFile, findAndReplaceText };