const { ipcRenderer } = require('electron');

let remove_list = [];

function sleep(ms) {
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

ipcRenderer.on('auto_clean_res', (event, output) => 
{
    remove_list = [];
    const folders = document.getElementById("folders");
    folders.innerHTML = '';
    const loader = document.getElementById("loader");
    loader.classList.add("hidden");
    const content = document.getElementById("content");
    content.classList.remove("hidden")
    ipcRenderer.send('files', 'file');
    ipcRenderer.send('storage', 'info');

});
ipcRenderer.on('clean_with_list_res', (event, output) => {
    remove_list = [];
    const folders = document.getElementById("folders");
    folders.innerHTML = '';
    const loader = document.getElementById("loader");
    loader.classList.add("hidden");
    const content = document.getElementById("content");
    content.classList.remove("hidden")
    ipcRenderer.send('files', 'file');
    ipcRenderer.send('storage', 'info');

});


function folder_selected(element)
{
    const delete_button = document.getElementById('delete_button');
    let att = element.getAttribute('clicked');
    if( att  === "off")
    {
        element.classList.remove("opacity-100");
        element.classList.remove("hover:opacity-80");
        element.classList.remove("hover:scale-[0.98]");
        element.classList.add("opacity-50");
        element.classList.add("scale-[0.95]");
        element.setAttribute('clicked', 'on');
        remove_list.push(element.getAttribute('dir'))
    }
    else
    {
        element.classList.add("opacity-100");
        element.classList.add("hover:opacity-80");
        element.classList.add("hover:scale-[0.98]");
        element.classList.remove("opacity-50");
        element.classList.remove("scale-[0.95]");
        element.setAttribute('clicked', 'off');
        remove_list = remove_list.filter(item => item !== element.getAttribute('dir'));

    }
    if(remove_list.length === 0)
    {
        delete_button.classList.add('hidden');
    }
    else
    {
        delete_button.classList.remove('hidden');
    }
    console.log(remove_list);
}
async function auto_clean()
{
    const loader = document.getElementById("loader");
    loader.classList.remove("hidden");
    const content = document.getElementById("content");
    content.classList.add("hidden")
    const delete_button = document.getElementById('delete_button');
    delete_button.classList.add("hidden");
    await sleep(1000);
    ipcRenderer.send('auto_clean', 'yes');

}

async function clean_with_list()
{
    const loader = document.getElementById("loader");
    loader.classList.remove("hidden");
    const content = document.getElementById("content");
    content.classList.add("hidden")
    const delete_button = document.getElementById('delete_button');
    delete_button.classList.add("hidden")
    await sleep(1000);
    ipcRenderer.send('clean_with_list', JSON.stringify(remove_list));

}
ipcRenderer.on('files-res', (event, output) => {
    const res = JSON.parse(output)
    const folders = document.getElementById("folders");
    const loader = document.getElementById("loader");
    loader.classList.add("hidden");
    const content = document.getElementById("content");
    content.classList.remove("hidden")
    res.map(el =>{
        let dir = el['directory'].split('/').at(-1);
        if (dir.length >= 9) {
            dir = dir.substr(0, 8);
            dir += '..';
        }
        let child = document.createElement('span');
        child.setAttribute("size", el['size']);
        child.setAttribute("dir", el['directory']);
        child.setAttribute("onclick",'folder_selected(this)');
        child.setAttribute("clicked",'off');
        child.className = "opacity-100 hover:opacity-80 h-[150px] flex-col hover:scale-[0.98] duration-200 transition-all cursor-pointer w-full flex justify-center items-center rounded-md"
        const content = ` 
          <img style="filter: drop-shadow(5px 5px 10px rgba(101, 70, 26, 0.47)); " class= "relative w-full h-auto p-4" src="../icons/folder.png" alt="">
          <span class="flex-col absolute flex justify-center items-center">
            <h1>${dir}</h1>
            <h1 class="text-[#f5ac02]">${el['size']}</h1>
          </span>
        `
        child.innerHTML = content;
        folders.appendChild(child);
    })
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
    if(file === "cleaner")
        {
            ipcRenderer.send('user-name', 'username');
            ipcRenderer.send('files', 'file');
            ipcRenderer.send('storage', 'info');
        }
    
});

