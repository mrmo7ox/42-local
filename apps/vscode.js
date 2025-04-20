var os = require('os');
const fs = require('fs');
const filePath = './apps.json';
const {removeFolder, removeFile, downloadFile , extractTarFile, appendTextToFile, creatTextToFile, findAndReplaceText} = require('./utils');
const { exec } = require('child_process');




async function install(name, downloadUrl, tmpFile, installDir, binaryPath, alias, homeDir, desktopEntry, appdir) {
  try {
    const result = await downloadFile(downloadUrl, tmpFile);
    if (result) {
      try {
        await extractTarFile(tmpFile, installDir);
        await appendTextToFile(`${homeDir}/.bashrc`, `\nalias ${alias}="${binaryPath}"`);
        await appendTextToFile(`${homeDir}/.zshrc`, `\nalias ${alias}="${binaryPath}"`);
        await creatTextToFile(`${appdir}${name}.desktop`, desktopEntry);
      } catch (err) {
        console.error(`Error during installation: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`Error in install function: ${err.message}`);
  }
}



function updateFile(name, n_status, filePath) {
  try {
    let content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    content.forEach((item) => {
      if (item[name]) {
        item[name].status = n_status;
        console.log(`Updated status for ${name}:`, item[name].status);
      }
    });
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error updating file: ${err.message}`);
  }
}

async function createSettingsFile(basePath) {
    try {
      const targetDir = path.join(basePath, '.config', 'Code', 'User');
      const settingsFilePath = path.join(targetDir, 'settings.json');
  
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log(`Directory created: ${targetDir}`);
      } else {
        console.log(`Directory already exists: ${targetDir}`);
      }
  
      if (!fs.existsSync(settingsFilePath)) {
        const defaultSettings = JSON.stringify({ theme: "dark", fontSize: 14 }, null, 2);
        fs.writeFileSync(settingsFilePath, defaultSettings, 'utf8');
        console.log(`File created: ${settingsFilePath}`);
      } else {
        console.log(`File already exists: ${settingsFilePath}`);
      }
    } catch (err) {
      console.error(`Error creating settings.json: ${err.message}`);
    }
  }
function addzsh(filepath)
{
    createSettingsFile(filepath);
    const text =`"terminal.integrated.profiles.linux": {
    "zsh": {
            "path": "/usr/bin/flatpak-spawn",
            "args": ["--host", "--env=TERM=xterm-256color", "zsh"],
            "overrideName": true,
        }
    },
    "terminal.integrated.defaultProfile.linux": "zsh",`
    appendTextToFile(filepath, text);
}

async function vscode(action, info) {
  const homeDir = os.homedir();
  const name = info.id;
  const downloadUrl = info.downloadUrl;
  const installDir = info.installDir.replace('~', homeDir);
  const icon = info.icon;
  const tmpFile = `${homeDir}/goinfre/file.tar.gz`;
  const binaryPath = info.binaryPath;
  const appdir = info.appdir.replace('~', homeDir);
  const alias = info.alias;

  const desktopEntry = `[Desktop Entry]\nName=${name}\nComment=${name}\nExec=${binaryPath}\nIcon=${icon}\nType=Application\nTerminal=false\nCategories=Utility`;

  if (action === 'install') {
    try {
      await install(name, downloadUrl, tmpFile, installDir, binaryPath, alias, homeDir, desktopEntry, appdir);
      exec(`source ${homeDir.replace('~', homeDir)}/.bashrc`);
      exec(`source ${homeDir.replace('~', homeDir)}/.zshrc`);
      addzsh(homeDir.replace('~', homeDir));
      updateFile(info.id, 'yes', filePath);
      return 'Success';
    } catch (err) {
      console.error(`Error during installation: ${err.message}`);
    }
  } else if (action === 'uninstall') {
    try {
      removeFile(`${appdir}${name}.desktop`);
      removeFolder(installDir);
      findAndReplaceText(`${homeDir.replace('~', homeDir)}/.bashrc`, `alias ${alias}="${binaryPath}"`, '');
      findAndReplaceText(`${homeDir.replace('~', homeDir)}/.zshrc`, `alias ${alias}="${binaryPath}"`, '');
      exec(`source ${homeDir.replace('~', homeDir)}/.bashrc`);
      exec(`source ${homeDir.replace('~', homeDir)}/.zshrc`);
      updateFile(info.id, 'no', filePath);
    } catch (err) {
      console.error(`Error during uninstallation: ${err.message}`);
    }
  }
}


module.exports = {vscode, updateFile};