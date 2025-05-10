import os
import json
import requests
from datetime import datetime, timedelta, timezone
from flask import Flask, redirect, request

app = Flask(__name__)


TOKEN_FILE = 'token.json'  # File to store the token

# Authorization URLs
AUTH_URL = "https://api.intra.42.fr/oauth/authorize"
TOKEN_URL = "https://api.intra.42.fr/oauth/token"
API_URL = "https://api.intra.42.fr/v2/me"

def load_token():
    """Load the token from a file."""
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'r') as file:
            return json.load(file)
    return None

def save_token(token_data):
    """Save the token and its expiration time to a file."""
    with open(TOKEN_FILE, 'w') as file:
        json.dump(token_data, file)

def is_token_valid(token_data):
    """Check if the saved token is valid (not expired)."""
    if token_data:
        expiration_time = datetime.fromisoformat(token_data['expires_at'])
        return datetime.now() < expiration_time
    return False

def get_new_token(code):
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

    if token_response.status_code != 200:
        return None

    token_data = token_response.json()
    expires_in = token_data.get("expires_in", 0)
    expires_at = (datetime.now() + timedelta(seconds=expires_in)).isoformat()

    # Add expiration time to token data
    token_data['expires_at'] = expires_at

    save_token(token_data)
    return token_data

def get_access_token(code=None):
    """Get the access token, either from file or by generating a new one."""
    token_data = load_token()

    if token_data and is_token_valid(token_data):
        return token_data['access_token']  # Return the valid token from file

    if code:
        # If no valid token, generate a new one using the provided code
        new_token = get_new_token(code)
        if new_token:
            return new_token['access_token']
    return None

@app.route("/")
def index():
    auth_url = f"{AUTH_URL}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code"
    return redirect(auth_url)


def is_27_there(locations):
    if not locations:
        return False
    res = False
    for entry in locations:
        if 'begin_at' in entry and entry['begin_at']:
            if "-27" in entry['begin_at']:
                res = True
                break
    return res

def is_time_in_range(time):
    time = str(time)
    today = datetime.now()
    first_day_of_this_month = today.replace(day=1)
    last_month_end = first_day_of_this_month - timedelta(days=1)
    last_month_start = last_month_end.replace(day=27)
    start_date = last_month_start.isoformat()
    end_date = today.isoformat()
    try:
        time_obj = datetime.fromisoformat(time.replace("Z", "+00:00"))
    except ValueError:
        return False
    if start_date <= time <= end_date:
        return True
    else:
        return False

@app.route("/callback")
def callback():
    code = request.args.get("code")
    if not code:
        return "Error: No authorization code provided.", 400
    access_token = get_access_token(code)
    if not access_token:
        return "Error: Failed to obtain access token.", 400
    headers = {"Authorization": f"Bearer {access_token}"}
    user_response = requests.get(API_URL, headers=headers)
    if user_response.status_code != 200:
        return "Error: Failed to fetch user data.", 400
    user_data = user_response.json()
    user_login = user_data.get("login")
    locations_url = f"https://api.intra.42.fr/v2/users/moel-oua/locations"
    
    page_number = 1
    locations = None
    while (is_27_there(locations) == False):
        url_with_range = f"{locations_url}?page[size]=100?page[size]={page_number}"
        locations_response = requests.get(url_with_range, headers=headers)
        if locations_response.status_code != 200:
            return "Error: Failed to fetch user locations.", 400
        locations = locations_response.json()
        page_number += 1

    total_time_seconds = 0

    for entry in locations:
        if 'begin_at' in entry and entry['begin_at']:
            begin_time = datetime.fromisoformat(entry['begin_at'].replace("Z", "+00:00"))
        else:
            continue 
        if  is_time_in_range(begin_time):
            end_time_str = entry.get('end_at')
            if end_time_str:
                end_time = datetime.fromisoformat(end_time_str.replace("Z", "+00:00"))
                duration = end_time - begin_time
                total_time_seconds += duration.total_seconds()
            else:
                end_time = datetime.now(timezone.utc)
                duration = end_time - begin_time
                total_time_seconds += duration.total_seconds()

    total_time_hours = total_time_seconds // 3600
    total_time_minutes = (total_time_seconds % 3600) // 60

    return f"{total_time_hours}"

if __name__ == "__main__":
    app.run(debug=True, port=5000)
