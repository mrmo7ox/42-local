
const { ipcRenderer, shell } = require('electron');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function loaderoff(status) {
    if (status === "off") {
        console.log(status)
        const loader = document.getElementById('loader');
        const content = document.getElementById('content');
        loader.classList.add('hidden');
        content.classList.remove('hidden');
    }
    else if (status === "on") {
        document.addEventListener('DOMContentLoaded', () => {
            const loader = document.getElementById('loader');
            loader.classList.remove('hidden')
            const content = document.getElementById('content');
            content.classList.add('hidden')
        });
    }
}


ipcRenderer.on("profile-res", (event, data) => {
    const profileData = JSON.parse(data);
    console.log("Profile Data:", profileData);

    if (profileData) {
        const user_profile = document.getElementById('user_profile');
        const logtime = document.getElementById('logtime');
        const child = document.createElement('img');
        const teams_div = document.getElementById('teams');

        let image = profileData.image;
        let username = profileData.name;
        let teams = profileData.teams;
        let logtime_value = profileData.total_hours;

        child.setAttribute('src', image);
        child.classList.add("rounded-full");

        let int_value = parseInt(logtime_value, 10);
        const interval = setInterval(() => {
            if (int_value <= 0) {
                clearInterval(interval);
                return;
            }
            logtime.textContent = `${parseInt(logtime_value, 10) - int_value} ⏱️`;
            int_value--;
        }, 1);

        teams.forEach(item => {
            let users = []
            const group_name = item.name;
            const project = item.project;
            const st = item.status;
            users = item.users.map(u => u[0]).join(', ');
            let url = `https://profile.intra.42.fr/users/${users.split(',')[0]}`
            console.log(url)
            const team = document.createElement('a');
            team.setAttribute("herf", url);
            team.className = "curser-pointer h-[150px] flex flex-row shadow-xl h-24 w-full bg-[#2a3139] rounded-md p-2 hover:scale-[0.98] hover:bg-[#2a313975] duration-200 ease-in-out";

            let content = `
                <span id="info" class=" flex flex-col justify-evenly">
                    <h1>🎀 name: ${group_name} </h1>
                    <h1>🗂️ project: ${project}</h1>
                    <h1>❓ status: ${st}</h1>
                    <h1>👨🏻‍💻 users: ${users}</h1>
                </span>
            `;

            team.innerHTML = content;
            team.addEventListener('click', (event) => {
                event.preventDefault();
                console.log(url)
                shell.openExternal(url);
            });
            teams_div.appendChild(team);
        });

        user_profile.appendChild(child);
        alert(`Logged in as User ID: ${profileData.userId}`);
        loaderoff("off");
    } else {
        alert("Login failed or no data received.");
    }
});

window.addEventListener('load', () => {

    let path = window.location.href;
    let file = path.split("/").at(-1).replace(".html", "");
    if (file === "profile") {
        ipcRenderer.send('profile');
    }

});