const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { BrowserWindow } = require("electron");
const { ipcMain } = require("electron");

const TOKEN_PATH = "/tmp/token.json";
const SERVER_URL = "https://42-api-2.vercel.app/";
const API_URL = "https://api.intra.42.fr/v2/me";

const getToken = () => {
    if (fs.existsSync(TOKEN_PATH)) {
        try {
            const content = fs.readFileSync(TOKEN_PATH, "utf8");
            const storedToken = JSON.parse(content);
            return storedToken.access_token;
        } catch (err) {
            console.error("Failed to read or parse token file:", err);
            return null;
        }
    }
    return null;
};

const storeToken = (token) => {
    try {
        fs.writeFileSync(TOKEN_PATH, JSON.stringify({ access_token: token }));
        console.log("Token stored successfully");
    } catch (err) {
        console.error("Failed to store the token:", err.message);
    }
};

function isTimeInRange(time) {
    const today = new Date();
    const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthEnd = new Date(firstDayOfThisMonth);
    lastMonthEnd.setDate(0);
    const lastMonthStart = new Date(lastMonthEnd);
    lastMonthStart.setDate(27);

    const timeObj = new Date(time);
    return !isNaN(timeObj.getTime()) && timeObj >= lastMonthStart && timeObj <= today;
}

async function logtime(headers, userData) {
    const userLogin = userData.login;
    const locationsUrl = `https://api.intra.42.fr/v2/users/${userLogin}/locations?page[size]=100`;

    try {
        const locationsResponse = await axios.get(locationsUrl, { headers });
        const locations = locationsResponse.data;

        const totalTimeSeconds = locations.reduce((total, entry) => {
            if (entry.begin_at && isTimeInRange(entry.begin_at)) {
                const beginTime = new Date(entry.begin_at);
                const endTime = entry.end_at ? new Date(entry.end_at) : new Date();
                total += (endTime - beginTime) / 1000;
            }
            return total;
        }, 0);

        return { userLogin, totalTimeSeconds };
    } catch (error) {
        console.error("Error fetching user locations:", error);
        return { userLogin, totalTimeSeconds: 0 };
    }
}

async function getTeams(headers) {
    const teamsUrl =
        "https://api.intra.42.fr/v2/cursus/21/teams?filter[campus]=16&filter[status]=waiting_for_correction&sort=-created_at";

    try {
        const response = await axios.get(teamsUrl, { headers });
        return response.data;
    } catch (error) {
        console.error("Error fetching teams:", error);
        return [];
    }
}

async function check_token() {
    console.log("Checking token...");
    const token = getToken();
    if (!token) {
        console.error("No token found. Opening login window...");
        return new Promise((resolve) => {
            createLoginWindow((newToken) => {
                console.log("Login successful, retrying token validation...");
                storeToken(newToken);
                resolve(check_token());
            });
        });
    }

    const config = {
        method: "get",
        url: API_URL,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    try {
        const response = await axios.request(config);
        const userData = response.data;

        const { userLogin, totalTimeSeconds } = await logtime(config.headers, userData);
        const teams = await getTeams(config.headers);

        const formattedTeams = teams.map((team) => {
            const users = team.users.map((user) => [user.login, user.url]);
            const project = team.project_gitlab_path.split("/").pop();
            return {
                users,
                project,
                name: team.name.substring(0, 20),
                status: team.status,
            };
        });

        return {
            success: true,
            image: userData.image.link,
            userId: userLogin,
            total_hours: Math.floor(totalTimeSeconds / 3600),
            teams: formattedTeams,
        };
    } catch (error) {
        console.error("Token validation failed:", error);
        return new Promise((resolve) => {
            createLoginWindow((newToken) => {
                console.log("Login successful, retrying token validation...");
                storeToken(newToken);
                resolve(check_token());
            });
        });
    }
}

const createLoginWindow = (onLoginSuccess, visible = true) => {
    const loginWin = new BrowserWindow({
        width: 400,
        height: 500,
        show: visible,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    const executeScript = async () => {
        try {
            const pageData = await loginWin.webContents.executeJavaScript(`
                new Promise((resolve, reject) => {
                    const SERVER_URL = "${SERVER_URL}";
                    const checkForToken = setInterval(() => {
                        if (window.location.href.includes(SERVER_URL)) {
                            const token = document.body.innerText.trim(); 
                            if (token) {
                                clearInterval(checkForToken);
                                resolve(token);
                            }
                        }
                    }, 500);
            
                    setTimeout(() => {
                        clearInterval(checkForToken);
                        reject(new Error("Token not found within timeout."));
                    }, 30000); // 30-second timeout
                });
            `);
            if (pageData) {
                console.log("Token received:", pageData);
                if (onLoginSuccess) onLoginSuccess(pageData);
                loginWin.close();
            }
        } catch (error) {
            console.error("Error executing login script:", error);
        }
    };

    loginWin.loadURL(SERVER_URL);

    loginWin.webContents.on("did-navigate", executeScript);
    loginWin.webContents.on("did-navigate-in-page", executeScript);

    loginWin.on("closed", () => console.log("Login window closed."));
};

module.exports = {
    createLoginWindow,
    check_token,
};