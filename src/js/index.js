const { ipcRenderer } = require('electron');

ipcRenderer.on('user-name', (event, output) => {
    const usernamediv = document.querySelector("#user");
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

window.addEventListener('load', () => {
    
    let path = window.location.href;
    let file = path.split("/").at(-1).replace(".html", "");
    if(file === "index")
    {
        ipcRenderer.send('user-name', 'username');
    }
  
});

function handleExternalLinks() {
    const links = document.querySelectorAll('a[href^="http://"], a[href^="https://"]');
  
    links.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
  
        const url = link.getAttribute('href');
  
        if (url && window.electronAPI && typeof window.electronAPI.openExternal === 'function') {
          window.electronAPI.openExternal(url);
        } else {
          console.error('electronAPI.openExternal is not available. Check your preload script.');
        }
      });
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleExternalLinks);
  } else {
    handleExternalLinks();
  }