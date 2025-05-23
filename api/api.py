const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { BrowserWindow } = require("electron");
const { ipcMain } = require("electron");

const TOKEN_PATH = "/media/moel-oua/2E47CA5B58C50162/42-local/token.json";
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

const isTimeInRange = (time) => {
    const today = new Date();
    const firstDayOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthEnd = new Date(firstDayOfThisMonth);
    lastMonthEnd.setDate(0);
    const lastMonthStart = new Date(lastMonthEnd);
    lastMonthStart.setDate(27);

    const startDate = lastMonthStart.toISOString();
    const endDate = today.toISOString();

    const timeObj = new Date(time);
    if (isNaN(timeObj.getTime())) {
        return false;
    }

    return timeObj > new Date(startDate) && timeObj < new Date(endDate);
};

const logtime = async (headers, userData) => {
    const userLogin = userData.login;
    const locationsUrl = `https://api.intra.42.fr/v2/users/${userLogin}/locations`;

    let pageNumber = 0;
    let locations = [];
    let urlWithRange = `${locationsUrl}?page[size]=100&page[number]=${pageNumber}`;

    try {
        const locationsResponse = await axios.get(urlWithRange, { headers });
        locations = locationsResponse.data;
    } catch (error) {
        console.error("Error fetching locations:", error);
        return { userLogin, totalTimeSeconds: 0 };
    }

    const totalTimeSeconds = locations.reduce((acc, entry) => {
        if (entry.begin_at) {
            const beginTime = new Date(entry.begin_at.replace("Z", "+00:00"));
            if (isTimeInRange(beginTime)) {
                const endTimeStr = entry.end_at;
                if (endTimeStr) {
                    const endTime = new Date(endTimeStr.replace("Z", "+00:00"));
                    const duration = (endTime - beginTime) / 1000; // Convert milliseconds to seconds
                    acc += duration;
                } else {
                    const endTime = new Date();
                    const duration = (endTime - beginTime) / 1000;
                    acc += duration;
                }
            }
        }
        return acc;
    }, 0);

    return { userLogin, totalTimeSeconds };
};

const getTeams = async (headers) => {
    const locationsUrl =
        "https://api.intra.42.fr/v2/cursus/21/teams?filter[campus]=16&filter[status]=waiting_for_correction&sort=-created_at";

    try {
        const locationsResponse = await axios.get(locationsUrl, { headers });
        return locationsResponse.data;
    } catch (error) {
        console.error("Error fetching teams:", error);
        return [];
    }
};

const check_token = async () => {
    console.log("Checking token...");
    const config = {
        method: "get",
        maxBodyLength: Infinity,
        url: API_URL,
        headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "text/plain",
        },
    };

    try {
        const response = await axios.request(config);
        const userData = response.data;
        const { userLogin, totalTimeSeconds } = await logtime(config.headers, userData);
        const teams = await getTeams(config.headers);

        const newTeams = teams.map((team) => {
            const users = team.users.map((user) => [user.login, user.url]);
            const name = team.name.substring(0, 20);
            const status = team.status;
            const project = team.project_gitlab_path.split("/").pop();

            return {
                users,
                project,
                name,
                status,
            };
        });

        return {
            success: true,
            image: userData.image.link,
            userId: userLogin,
            total_hours: Math.floor(totalTimeSeconds / 3600),
            teams: newTeams,
        };
    } catch (error) {
        console.error("Token validation failed. Showing login window...");
        return new Promise((resolve, reject) => {
            createLoginWindow((token) => {
                console.log("Login successful. Retrying token validation...");
                resolve(check_token());
            }, true);
        });
    }
};

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
                            console.log("Checking for token...");
                            const token = document.body.innerHTML.trim(); 
                            if (token) {
                                clearInterval(checkForToken);
                                console.log('Token found and sent:', token);
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
                console.log("JSON data found on the page:", pageData);
                if (onLoginSuccess) {
                    storeToken(pageData);
                    onLoginSuccess(pageData);
                }
                loginWin.close();
            }
        } catch (error) {
            console.error("Error executing script on page:", error);
        }
    };

    loginWin.loadURL(`${SERVER_URL}/`);

    loginWin.webContents.on("did-navigate", executeScript);
    loginWin.webContents.on("did-navigate-in-page", executeScript);

    loginWin.on("closed", () => {
        console.log("Login window closed.");
    });
};

ipcMain.on("callback", async (event, arg) => {
    try {
        const result = await check_token();
        event.reply("callback-res", result);
    } catch (error) {
        console.error("Error during callback:", error);
        event.reply("callback-res", { success: false, error: error.message });
    }
});

module.exports = {
    createLoginWindow,
    check_token,
};