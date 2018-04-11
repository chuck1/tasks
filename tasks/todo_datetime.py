import functools
import collections
import os
import time
import datetime
from pprint import pprint
import re
import enum

import crayons
import pytz
import pymongo
import bson

# datetime
tz = pytz.timezone('US/Pacific')
#utc = datetime.timezone.utc

def datetimeToString(d):
    if d is None: return None
    try:
        d = d.astimezone(tz)
    except:
        d = pytz.utc.localize(d)
        d = d.astimezone(tz)
    return d.strftime("%Y-%m-%d %H:%M")

def stringToDatetime(s):
    if s:
        try:
            naive = datetime.datetime.strptime(s, "%Y-%m-%d %H:%M")
            return tz.localize(naive).astimezone(pytz.utc)
        except: pass
            
        naive = datetime.datetime.strptime(s, "%Y-%m-%d %H:%MZ")
        return pytz.utc.localize(naive)
    else:
        return None

def now():
    return datetime.datetime.now(datetime.timezone.utc).astimezone(tz)

def utcnow():
    return datetime.datetime.now(datetime.timezone.utc)

def weeks(i):
    return datetime.timedelta(weeks=i)

def day_of_week(i, h, m, s):
    """
    returns datetime for the next day of the week indicated by the index
    """
    today = now().date()
    d = i - today.weekday()
    if d <= 0:
        d += 7

    return local_combine(today + datetime.timedelta(days=d), h, m, s)

def monday(h, m=0, s=0):
    """
    returns datetime object for next monday
    """
    return day_of_week(0, h, m, s)

def tuesday(h, m=0, s=0):
    """
    returns datetime object for next tuesday
    """
    return day_of_week(1, h, m, s)

def wednesday(h, m=0, s=0):
    """
    returns datetime object for next wednesday
    """
    return day_of_week(2, h, m, s)

def thursday(h, m=0, s=0):
    """
    returns datetime object for next thursday
    """
    return day_of_week(3, h, m, s)

def friday(h, m=0, s=0):
    """
    returns datetime object for next friday
    """
    return day_of_week(4, h, m, s)

def saturday(h, m=0, s=0):
    """
    returns datetime object for next saturday
    """
    return day_of_week(5, h, m, s)

def sunday(h, m=0, s=0):
    """
    returns datetime object for next sunday
    """
    return day_of_week(6, h, m, s)

def local_combine(date, h, m, s):
    return tz.localize(datetime.datetime.combine(date, datetime.time(h, m, s)))

def local_datetime(year, month, day, hour=0, minute=0, second=0):
    return tz.localize(datetime.datetime(year, month, day, hour, minute, second))


