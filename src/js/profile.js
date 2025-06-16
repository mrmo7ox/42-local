const { ipcRenderer, shell } = require('electron');

let allTeams = [];
let profileGlobal;

function loaderoff(status) {
    if (status === "off") {
        console.log(status)
        const loader = document.getElementById('loader');
        const content = document.getElementById('content');
        const search = document.getElementById('search');
        loader.classList.add('hidden');
        content.classList.remove('hidden');
        search.classList.remove('hidden');
    }
    else if (status === "on") {
        document.addEventListener('DOMContentLoaded', () => {
            const loader = document.getElementById('loader');
            loader.classList.remove('hidden')
            const content = document.getElementById('content');
            content.classList.add('hidden')
            const search = document.getElementById('search');
            search.classList.add('hidden')
        });
    }
}

window.addEventListener('load', () => {
    let path = window.location.href;
    let file = path.split("/").at(-1).replace(".html", "");
    if (file === "profile") {
        ipcRenderer.send('profile');
    }
});

function renderProfileHeader(data) {
    const user_profile = document.getElementById('user_profile');
    const logtime = document.getElementById('logtime');

    //clear
    user_profile.innerHTML = '';
    logtime.textContent = '';

    const img = document.createElement('img');
    img.src = data.image;
    img.className = 'rounded-full';
    user_profile.appendChild(img);

    let remaining = parseInt(data.total_hours, 10);
    const start = remaining;
    const interval = setInterval(() => {
        if (remaining <= 0) {
            clearInterval(interval);
            return;
        }
        logtime.textContent = `${start - remaining} ⏱️`;
        remaining--;
    }, 1);
}

function renderTeams(teamsArray) {
    const teamsDiv = document.getElementById('teams');
    //clear
    teamsDiv.innerHTML = '';

    teamsArray.forEach(item => {
        const group_name = item.name;
        const project = item.project;
        const status = item.status;
        const usersList = item.users.map(u => u[0]).join(', ');
        const url = `https://profile.intra.42.fr/users/${usersList.split(',')[0]}`;

        const team = document.createElement('a');
        team.href = url;
        team.className = "curser-pointer h-[150px] flex flex-row shadow-xl h-24 w-full bg-[#2a3139] rounded-md p-2 hover:scale-[0.98] hover:bg-[#2a313975] duration-200 ease-in-out";

        team.innerHTML = `
      <span class="flex flex-col justify-evenly">
        <h1>🚀 project name: ${group_name}</h1>
        <h1>🗂️ project: ${project}</h1>
        <h1>❓ status: ${status}</h1>
        <h1>👨🏻‍💻 users: ${usersList}</h1>
      </span>
    `;

        team.addEventListener('click', e => {
            e.preventDefault();
            shell.openExternal(url);
        });

        teamsDiv.appendChild(team);
    });
}

function searchFilter() {
    const inputEl = document.getElementById('search-field');

    inputEl.addEventListener('input', (e) => {
        const term = e.target.value.trim().toLowerCase();
        if (term === '') {
            renderTeams(allTeams);
            return;
        }

        const filtered = allTeams.filter(team => {
            const projectMatch = team.project.toLowerCase().includes(term);

            const userMatch = team.users.some(userEntry => {
                const username = userEntry[0].toLowerCase();
                return username.includes(term);
            });

            //if one of them true return true
            return projectMatch || userMatch;
        });

        renderTeams(filtered);
    });
}

ipcRenderer.on('profile-res', (event, data) => {
    profileGlobal = JSON.parse(data);
    console.log('Profile Data:', profileGlobal);

    if (!profileGlobal) {
        alert('Login failed or no data received.');
        return;
    }

    allTeams = profileGlobal.teams;

    // render header
    renderProfileHeader(profileGlobal);
    // render teams
    renderTeams(allTeams);

    loaderoff('off');
    searchFilter();
});
