from flask import Flask, redirect, request, session, url_for
import requests
from datetime import datetime, timezone

app = Flask(__name__)

# 42 API credentials
# CLIENT_ID = "u-s4t2ud-6d6ad11eea6f64c88e3e868d4a2053654cd768065c2b728d56e22c6de6316f93"
# CLIENT_SECRET = "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"
# REDIRECT_URI = "http://localhost:5000/callback"

# Authorization URLs
AUTH_URL = "https://api.intra.42.fr/oauth/authorize"
TOKEN_URL = "https://api.intra.42.fr/oauth/token"
API_URL = "https://api.intra.42.fr/v2/me"

@app.route("/")
def index():
    auth_url = f"{AUTH_URL}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code"
    return redirect(auth_url)

@app.route("/callback")
def callback():
    code = request.args.get("code")
    if not code:
        return "Error: No authorization code provided.", 400

    # Exchange code for access token
    token_response = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
            "redirect_uri": REDIRECT_URI,
        },
    )
    token_response.raise_for_status()
    access_token = token_response.json().get("access_token")

    # Get user information
    headers = {"Authorization": f"Bearer {access_token}"}
    user_response = requests.get(API_URL, headers=headers)
    user_response.raise_for_status()
    user_data = user_response.json()
    user_login = user_data.get("login")

    # Fetch user location sessions
    locations_url = f"https://api.intra.42.fr/v2/users/{user_login}/locations"
    locations_response = requests.get(locations_url, headers=headers)
    locations_response.raise_for_status()
    locations = locations_response.json()

    # Calculate total logged hours
    total_seconds = 0
    for loc in locations:
        begin_at = loc.get("begin_at")
        end_at = loc.get("end_at")
        if begin_at:
            begin = datetime.fromisoformat(begin_at.replace('Z', '+00:00'))
            end = datetime.fromisoformat(end_at.replace('Z', '+00:00')) if end_at else datetime.now(timezone.utc)
            total_seconds += (end - begin).total_seconds()

    total_hours = total_seconds / 3600
    return f"Hello, {user_login}! You have logged a total of {total_hours:.2f} hours."

if __name__ == "__main__":
    app.run(debug=True, port=5000)