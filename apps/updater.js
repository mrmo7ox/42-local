
const { autoUpdater } = require('electron-updater');
function updater_setup() {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.logger.transports.file.level = "info";
    autoUpdater.checkForUpdates();
    autoUpdater.on('update-available', (_info) => {
        console.log('Update available.');
    });

    autoUpdater.on('update-not-available', (_info) => {
        console.log('Update not available.');
    });

    autoUpdater.on('error', (err) => {
        console.error('Error in auto-updater. ' + err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
        let log_message = "Download speed: " + progressObj.bytesPerSecond;
        log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
        log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
        console.log(log_message);
    });

    autoUpdater.on('update-downloaded', (_info) => {
        console.log('Update downloaded');
    });
}

module.exports = { updater_setup };