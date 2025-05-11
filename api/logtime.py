
import os
import json
import requests
from datetime import datetime, timedelta, timezone
from flask import Flask, redirect, request, make_response
import uuid
from logtime_utils import *
from logtime import *
from token_gen import *


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
    if(start_date < time < end_date):
     return start_date < time < end_date
    else:
        return False

def logtime(headers, user_data):
    user_login = user_data.get("login")
    locations_url = f"https://api.intra.42.fr/v2/users/{user_login}/locations"

    page_number = 0
    locations = None
    url_with_range = f"{locations_url}?page[size]=100&page[number]={page_number}"
    locations_response = requests.get(url_with_range, headers=headers)
    locations = locations_response.json()

    with open("data/res.json" , "w+") as f:
        json.dump(locations, f)
    total_time_seconds = 0

    for entry in locations:
        if 'begin_at' in entry and entry['begin_at']:
            begin_time = datetime.fromisoformat(entry['begin_at'].replace("Z", "+00:00"))
        else:
            continue
        if is_time_in_range(begin_time):

            end_time_str = entry.get('end_at')
            if end_time_str:
                end_time = datetime.fromisoformat(end_time_str.replace("Z", "+00:00"))
                duration = end_time - begin_time
                total_time_seconds += duration.total_seconds()
            else:
                end_time = datetime.now(timezone.utc)
                duration = end_time - begin_time
                total_time_seconds += duration.total_seconds()
    return user_login, total_time_seconds