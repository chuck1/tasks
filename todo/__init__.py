import time
import datetime
from pprint import pprint
import re

import crayons
import pytz
import pymongo

# datetime
tz = pytz.timezone('US/Pacific')
#utc = datetime.timezone.utc

def now():
    return datetime.datetime.now(datetime.timezone.utc).astimezone(tz)

def weeks(i):
    return datetime.timedelta(weeks=i)

def monday(h, m=0, s=0):
    i = 0
    today = now().date()
    d = i - today.weekday()
    if d <= 0:
        d += 7

    return local_combine(today + datetime.timedelta(days=d), h, m, s)

def local_combine(date, h, m, s):
    return tz.localize(datetime.datetime.combine(date, datetime.time(h, m, s)))

def local_datetime(year, month, day, hour=0, minute=0, second=0):
    return tz.localize(datetime.datetime(year, month, day, hour, minute, second))

class Session:
    def __init__(self, username):
        client = pymongo.MongoClient()
        self.db = client.todo_database

        self.user = self.db.users.find_one({'username':username})
        assert self.user is not None

    def task(self, title, due=None):
        
        t = {
                'title': title,
                'creator': self.user['_id'],
                'due': due.astimezone(pytz.utc)
                }
    
        return self.db.tasks.insert_one(t)
 
    def find(self, title_regex):
        for t in self.db.tasks.find({'title':{'$regex':title_regex}}).sort('due',pymongo.ASCENDING):
            yield t

session = Session('charles')

def task(title, due=None):
    return session.task(title, due)

def print_find(title_regex):
    for t in session.find(title_regex):
        due = pytz.utc.localize(t['due'])
        due = due.astimezone(tz)
        due_str = '{:25s}'.format(str(due))

        if due < now():
            color = crayons.red
        else:
            color = crayons.white
        
        print(color(due_str), crayons.white(t['title'], bold=True))

if __name__ == '__main__':
    print_find('')



