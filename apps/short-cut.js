const createDesktopShortcut = require('create-desktop-shortcuts');
var path = require('path');
var os = require('os');

function add_short() {
    createDesktopShortcut({
        verbose: true,
        linux: {
            filePath: path.join(__dirname, process.argv[1]),
            outputPath: path.join(os.homedir(), '.local', 'share', 'applications'),
            name: '42-local',
            description: 'Clean and install apps for free and locally',
            icon: path.join(__dirname, 'src/icons/icon.png'),
            type: 'Application',
            terminal: false,
            chmod: true,
            arguments: ''
        }
    });
}

module.exports = { add_short };