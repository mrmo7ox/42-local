import os
import json
import requests
from datetime import datetime, timedelta, timezone
from flask import Flask, redirect, request, make_response
import uuid
from logtime import *

CLIENT_ID = os.getenv('CLIENT_ID')
CLIENT_SECRET = os.getenv('CLIENT_SECRET')
REDIRECT_URI = os.getenv('REDIRECT_URI')
TOKEN_FILE = os.getenv('TOKEN_FILE')
AUTH_URL = os.getenv('AUTH_URL')
TOKEN_URL = os.getenv('TOKEN_URL')
API_URL = os.getenv('API_URL')




def load_tokens():
   
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE, 'r') as file:
            return json.load(file)
    return {}


def save_tokens(tokens):
   
    with open(TOKEN_FILE, 'w') as file:
        json.dump(tokens, file)


def is_token_valid(token_data):
   
    if token_data:
        expiration_time = datetime.fromisoformat(token_data.get('expires_at', ''))
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
    token_data['expires_at'] = (datetime.now() + timedelta(seconds=expires_in)).isoformat()
    return token_data




def token_steup(user_id):
    if not user_id:
        return "Error: No user ID found in cookies.", 400

    tokens = load_tokens()

    
    user_token = tokens.get(user_id)
    if user_token and is_token_valid(user_token):
        
        access_token = user_token['access_token']
    else:
        
        code = request.args.get("code")
        if not code:
            return "Error: No authorization code provided.", 400

        new_token = get_new_token(code)
        if not new_token:
            return "Error: Failed to obtain access token.", 400

        
        tokens[user_id] = new_token
        save_tokens(tokens)
        access_token = new_token['access_token']

    
    headers = {"Authorization": f"Bearer {access_token}"}
    user_response = requests.get(API_URL, headers=headers)
    if user_response.status_code != 200:
        return "Error: Failed to fetch user data.", 400
    return headers, user_response.json()


def token_steup(access_token):
    # if not user_id:
    #     return "Error: No user ID found in cookies.", 400
    # tokens = load_tokens()
    # user_token = tokens.get(user_id)
    # if user_token and is_token_valid(user_token):
    #     access_token = user_token['access_token']
    # else:
        code = request.args.get("code")
        new_token = get_new_token(code)
        if not new_token:
            return "Error: Failed to obtain access token.", 400
        tokens[user_id] = new_token
        save_tokens(tokens)
        access_token = new_token['access_token']
    headers = {"Authorization": f"Bearer {access_token}"}
    user_response = requests.get(API_URL, headers=headers)
    if user_response.status_code != 200:
        return "Error: Failed to fetch user data.", 400
    return headers, user_response.json()
