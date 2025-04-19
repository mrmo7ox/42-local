const { ipcRenderer } = require('electron');


ipcRenderer.on('user-name', (event, output) => {
    const usernamediv = document.querySelector("#user_cleaner");
    if(output)
    {
        let username = '';
        const res = output.split(' ');
        let first = res[0][0];
        let last = res[1][0];
        if(first)
        {
          username += first;
        }
        if(last)
        {
          username += last;
        }
        usernamediv.textContent = username;
        
    }
    else
    {
        usernamediv.textContent = "?";
    }
});

ipcRenderer.on('storage-res', (event, output) => {
    if(output)
    {
        const total = output['size'];
        const used = output['used'];
        const  available = output['available'];
        const  perc = output['usagePercentage'];
        const storage = document.getElementById('storage');
        const used_div = document.getElementById('used');
        const total_div = document.getElementById('total');
        total_div.textContent = `${total} MB`
        used_div.textContent = `${used} MB`
        storage.setAttribute('value', perc.replace('%',''))

    }
});


window.addEventListener('load', () => {
    
    let path = window.location.href;
    let file = path.split("/").at(-1).replace(".html", "");
    if(file === "installer")
        {
            ipcRenderer.send('user-name', 'username');
            ipcRenderer.send('storage', 'info');
            const folders = document.getElementById("folders");
            const loader = document.getElementById("loader");
            loader.classList.add("hidden");
            const content = document.getElementById("content");
            content.classList.remove("hidden")
        }
    
});
