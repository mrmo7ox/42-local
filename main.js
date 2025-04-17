const { app, BrowserWindow , ipcMain} = require('electron')
const { exec } = require('child_process');
const { error } = require('console');
const { stderr } = require('process');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
  })

  win.loadFile('index.html')
}

ipcMain.on('user-name', (event, arg) => {
   
    let cmd = "getent passwd $USER | cut -d ':' -f 5 | cut -d ',' -f 1"

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        event.reply('command-output', `Error: ${error.message}`);
        return;
      }
  
      if (stderr) {
        const readableStderr = typeof stderr === 'object' ? JSON.stringify(stderr, null, 2) : stderr;
        event.reply('command-output', `Stderr: ${readableStderr}`);
        return;
      }

      event.reply('command-output', `${stdout}`);
    });
  });
app.whenReady().then(() => {
  createWindow()
})