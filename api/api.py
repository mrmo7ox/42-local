import os
import json
import requests
from datetime import datetime, timedelta, timezone
from flask import Flask, redirect, request, make_response
import uuid
from logtime_utils import *
from logtime import *
from token_gen import *

app = Flask(__name__)
#(?<!\\S) """.*$
CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
REDIRECT_URI = os.getenv('REDIRECT_URI')
TOKEN_FILE = os.getenv('TOKEN_FILE')
AUTH_URL = os.getenv('AUTH_URL')
TOKEN_URL = os.getenv('TOKEN_URL')
API_URL = os.getenv('API_URL')


def get_teams(headers):
    locations_url = f"https://api.intra.42.fr/v2/cursus/21/teams?filter[campus]=16&filter[status]=waiting_for_correction&sort=-created_at"
    page_number = 0
    locations = None
    url_with_range = f"{locations_url}"
    locations_response = requests.get(url_with_range, headers=headers)
    print(locations_response)
    try :
        locations_response.json()
    except Exception as e:
         return e
    locations = locations_response.json()
    return locations
    
@app.route("/status")
def status():
    user_id = request.cookies.get("user_id")
    if not user_id:
        return {"logged_in": False}, 200
    try:
        headers, _ = token_steup(user_id)
        return {"logged_in": True}, 200
    except Exception as e:
        print(f"Token setup failed: {e}")
        return {"logged_in": False}, 200

@app.route("/")
def index():
    user_id = request.cookies.get("user_id")
    
    if not user_id:
        # If no user_id cookie, redirect to the login page
        auth_url = f"{AUTH_URL}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code"
        response = make_response(redirect(auth_url))
        response.set_cookie("user_id", str(uuid.uuid4()), httponly=True, max_age=30 * 24 * 60 * 60)  # 30 days
        return response
    try:
        headers, user_data = token_steup(user_id)
        print(user_data)
        image = user_data["image"]["link"]
        user_name, total_time_hours = logtime(headers, user_data)
        teams = get_teams(headers)
        new = []
        for team in teams:
            users = [user["login"] for user in team["users"]]
            name =  team['name'][0:20]
            status =  team['status']
            project =  team['project_gitlab_path'].split('/')[-1]
            items = {"users": users,"project": project,"name":name, "status":status}
            new.append(items)
        return {
            "success": True,
            "image": image,
            "userId" : user_name,
            "total_hours": total_time_hours // 3600,
            "teams": new,
        }, 200

    except Exception as e:
        print(f"Login/token setup error: {e}")
        return {
            "logged_in": False,
            "error": str(e),
            "login_url": f"{AUTH_URL}?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code"
        }, 200

@app.route("/callback")
def callback():
    user_id = request.cookies.get("user_id")
    if not user_id:
        return redirect('/')
    new = {"teams":[]}
    try:
        headers, user_data = token_steup(user_id)
        print(user_data)
        user_name, total_time_hours = logtime(headers, user_data)
        teams = get_teams(headers)
        new = []
        for team in teams:
            users = [user["login"] for user in team["users"]]
            name =  team['name'][0:20]
            status =  team['status']
            project =  team['project_gitlab_path'].split('/')[-1]
            items = {"users": users,"project": project,"name":name, "status":status}
            new.append(items)
        return {
            "success": True,
            "userId" : user_name,
            "total_hours": total_time_hours  // 3600,
            "teams": new,
        }, 200
    except Exception as e:
        print(f"Error during callback: {e}")
        return {
            "success": False,
            "error": str(e),
        }, 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
