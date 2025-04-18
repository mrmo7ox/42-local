const { ipcRenderer } = require('electron');

ipcRenderer.on('user-name', (event, output) => {
    const usernamediv = document.querySelector("#user");
    if(output)
    {
        let username = '';
        const res = output.split(' ');
        username += res[0][0];
        username += res[1][0];
        usernamediv.textContent = username;
        
    }
    else
    {
        usernamediv.textContent = "?";
    }
});

window.addEventListener('load', () => {
    
    let path = window.location.href;
    let file = path.split("/").at(-1).replace(".html", "");
    if(file === "index")
    {
        ipcRenderer.send('user-name', 'username');
    }
  
});
