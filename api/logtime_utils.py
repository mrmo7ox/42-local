
import os
import json
import requests
from datetime import datetime, timedelta, timezone
from flask import Flask, redirect, request, make_response
import uuid
from api import token_steup

def is_27_there(locations):
    if not locations:
        return False
    for entry in locations:
        if 'begin_at' in entry and entry['begin_at']:
            if "-27" in entry['begin_at']:
                return True
    return False


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