const { ipcRenderer } = require('electron');

ipcRenderer.send('user-name', 'username');

ipcRenderer.on('command-output', (event, output) => {
    const usernamediv = document.querySelector("#user");
    const user_cleaner = document.querySelector("#user_cleaner");
    if(output)
    {
        let name = '';
        const res = output.split(' ');
        name += res[0][0];
        name += res[1][0];
        console.log(name);
        usernamediv.textContent = name;
        user_cleaner.textContent = name;
    }
    else
    {
        usernamediv.textContent = "?";
    }
});