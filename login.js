const { BrowserWindow } = require("electron");
const axios = require("axios");

const SERVER_URL = 'http://10.11.8.11:5000'; // Replace with your Flask server URL

/**
 * Function to check token validity
 * @returns {Promise<boolean>} - Resolves to true if the token is valid, false otherwise
 */
const checkTokenValidity = async () => {
    try {
        const response = await axios.get(`${SERVER_URL}/status`, { withCredentials: true });
        return response.data.logged_in === true;
    } catch (error) {
        console.error("Error checking token validity:", error.message);
        return false;
    }
};

/**
 * Function to create a login window
 * @param {Function} onLoginSuccess - Callback function invoked with login data after successful login
 * @param {boolean} visible - If true, the window will be visible; otherwise, it will run in the background
 */
const createLoginWindow = (onLoginSuccess, visible = true) => {
    const loginWin = new BrowserWindow({
        width: 400,
        height: 500,
        show: visible, // Show or hide the window based on the "visible" parameter
        webPreferences: {
            nodeIntegration: false, // Disable Node.js in the login window
            contextIsolation: true, // Isolate context for security
        },
    });

    loginWin.loadURL(`${SERVER_URL}/`);

    // Check the page for JSON data after it loads
    loginWin.webContents.on("did-finish-load", async () => {
        try {
            const pageData = await loginWin.webContents.executeJavaScript(`
        (() => {
          try {
            const preElement = document.querySelector("pre"); // Check if there's a <pre> element (common for JSON responses)
            if (preElement) {
              return JSON.parse(preElement.innerText); // Try to parse it as JSON
            }
            return null; // No JSON data found
          } catch (error) {
            return null; // Return null if parsing fails
          }
        })();
      `);

            if (pageData) {
                console.log("JSON data found on the page:", pageData);

                // Trigger the callback with the JSON data
                if (onLoginSuccess) {
                    onLoginSuccess(pageData);
                }

                // Close the login window
                loginWin.close();
            }
        } catch (error) {
            console.error("Error checking page for JSON data:", error);
        }
    });

    loginWin.on("closed", () => {
        console.log("Login window closed.");
    });
};

module.exports = {
    createLoginWindow,
    checkTokenValidity,
};