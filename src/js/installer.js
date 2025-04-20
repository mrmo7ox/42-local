const { ipcRenderer } = require('electron');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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



async function on_off(st)
{
    if(st === "on")
    {
        const apps = document.getElementById("apps");
        const loader = document.getElementById("loader");
        loader.classList.add("hidden");
        const content = document.getElementById("content");
        content.classList.remove("hidden");
        await sleep(2000);
    }
    else if(st === "off")
    {
            const apps = document.getElementById("apps");
            const loader = document.getElementById("loader");
            loader.classList.remove("hidden");
            const content = document.getElementById("content");
            content.classList.add("hidden");
            await sleep(2000);
    }
}

ipcRenderer.on('apps-res', (event, output) => {
    if (output) {
        const apps = document.querySelector("#apps");
        apps.innerHTML = '';
        data = JSON.parse(output)
        on_off("on");
        data.forEach(element => {
            Object.keys(element).forEach(key => {
                let child = document.createElement('span');
                let button = document.createElement('button');
                let screen = document.createElement('screen');
                child.setAttribute("id", "el")
                button.setAttribute("name", key);
                button.setAttribute("downloadUrl", element[key].downloadUrl);
                button.setAttribute("installDir", element[key].installDir);
                button.setAttribute("icon", element[key].icon);
                button.setAttribute("tmpFile", element[key].tmpFile);
                button.setAttribute("binaryPath", element[key].binaryPath);
                button.setAttribute("appdir", element[key].appdir);
                button.setAttribute("alias", element[key].alias);
                button.setAttribute("status", element[key].status);
                button.setAttribute("onclick",'handle_app(this)');
                screen.setAttribute("id", "screen")
                if(element[key].status === "no")
                    {
                        
                    button.setAttribute("id",'b1');
                    button.className = " shadow-green-500 shadow-xl cursor-pointer bg-green-500 px-6 py-1 rounded-xl";
                    button.textContent = 'Install';
                    
                    screen.className = 'rounded-md absolute inset-0  bg-gradient-to-t from-green-300 to-transparent'
                }
                else
                {
                    button.setAttribute("id",'b2');
                    button.className = "shadow-red-500 shadow-xl cursor-pointer bg-red-500 px-6 py-1 rounded-xl";
                    button.textContent = 'Uninstall';
                    screen.className = 'rounded-md absolute inset-0  bg-gradient-to-t from-red-300 to-transparent'

                    
                }
                child.className = "my-1 relative scale-[0.98] bg-white h-[120px] flex-col duration-200 transition-all cursor-pointer w-full flex justify-center items-center rounded-md"
                const content = ` 
                <img style="" class= "relative w-full h-auto p-4" src="${element[key].icon}" alt="">
                <span class="flex-col absolute z-[66] flex justify-center items-center">
                ${button.outerHTML}
                </span>
                ${screen.outerHTML}
                `
                child.innerHTML = content;
                apps.appendChild(child);
            });
        });
    }
});

ipcRenderer.on('apps-installer-res',(event, output) =>{
    if(output)
    {
        ipcRenderer.send('apps', 'info');
        ipcRenderer.send('storage', 'info');
        on_off("on");
    }
})

function handle_app(button)
{
    on_off("off");
    let app = [] 
    
    app = {
        id : button.getAttribute("name"),
        downloadUrl : button.getAttribute("downloadUrl"),
        installDir : button.getAttribute("installDir"),
        icon : button.getAttribute("icon"),
        tmpFile : button.getAttribute("tmpFile"),
        binaryPath : button.getAttribute("binaryPath"),
        appdir : button.getAttribute("appdir"),
        alias : button.getAttribute("alias"),
        st : button.getAttribute("status"),
    }
    if (app)
    {
        console.log(JSON.stringify(app));
        ipcRenderer.send('apps-installer', JSON.stringify(app));

    }
}

window.addEventListener('load', () => {
    
    let path = window.location.href;
    let file = path.split("/").at(-1).replace(".html", "");
    if(file === "installer")
        {
            ipcRenderer.send('user-name', 'username');
            ipcRenderer.send('storage', 'info');
            ipcRenderer.send('apps', 'info');
        }
    
});
