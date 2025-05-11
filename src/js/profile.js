
const { ipcRenderer } = require('electron');

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
        const logtime = document.getElementById('logtime')
        const child = document.createElement('img');
        let image = profileData.image;
        let username = profileData.name;
        let teams = profileData.teams;
        let logtime_value = profileData.total_hours;

        // let group_name = profileData.name;
        // let project = teams.project;
        // let st = teams.st;
        // let users = teams.users

        child.setAttribute('src', image);
        child.classList.add("rounded-full");
        let int_value = parseInt(logtime_value, 10)
        const interval = setInterval(() => {
            if (int_value <= 0) {
                clearInterval(interval);
                return;
            }

            logtime.textContent = `${parseInt(logtime_value, 10) - int_value}⏱️`;
            int_value--;
        }, 1);

        user_profile.append(child);
        alert(`Logged in as User ID: ${profileData.userId}`);
        loaderoff("off")
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