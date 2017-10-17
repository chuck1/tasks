__version__ = '0.1'
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

class Status(enum.Enum):
    NONE = 0
    COMPLETE = 1
    CANCELLED = 2

def now():
    return datetime.datetime.now(datetime.timezone.utc).astimezone(tz)

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

class Session:
    """
    elements of the task record

    * title - string
    * creator - ObjectID of user
    * due - datetime object
    * status - integer

    """
    def __init__(self, username):
        if 'MONGO_URI' in os.environ:
            client = pymongo.MongoClient(os.environ['MONGO_URI'])
        else:
            client = pymongo.MongoClient()
            warnings.warn("using local mongo server")

        self.db = client.todo_database

        self.user = self.db.users.find_one({'username':username})
        assert self.user is not None

    def task(self, title, due=None):
        """
        :param title: title
        :param due: datetime object

        create a new task
        """
        if due:
            due_utc = due.astimezone(pytz.utc)
        else:
            due_utc = None

        print(due)
        print(due_utc)

        t = {
                'title': title,
                'creator': self.user['_id'],
                'due': due_utc,
                'status': Status.NONE.value,
                }
    
        return self.db.tasks.insert_one(t)
    
    def filter_title_1(self, s):
        return fand([
            self.filter_title(s),
            {'status': {'$eq': Status.NONE.value}}])

    def filter_title(self, s):
        return {'title': {'$regex': s}}
        filt = self.filter_title_regex(title_regex)

    def filter_id(self, id_):
        return {"_id": bson.objectid.ObjectId(id_)}

    def find(self, filt):
        for t in self.db.tasks.find(filt).sort('due', pymongo.ASCENDING):
            yield t
    
    def delete_many(self, filt):
        return self.db.tasks.delete_many(filt)

    def update_status(self, filt, status):
        """
        update the status of all tasks whose title matches the regex
        """
        assert isinstance(status, Status)
        self.db.tasks.update_many(filt, {'$set': {'status': status.value}})

    def show(self, filt):
        for t in self.find(filt):
            t = _Task(t)
            id_str = str(t.d['_id'])#[-4:]
            print(id_str, t.due_str(), t.status_str(), crayons.white(t.d['title'], bold=True))


def fand(f):
    assert isinstance(f, list)
    return {'$and': f}

class _Task:
    def __init__(self, d):
        self.d = d
    def due_str(self):
        due = self.d['due']
        if due:
            due = pytz.utc.localize(due)
            due = due.astimezone(tz)
            due_str = '{:25s}'.format(str(due))

            if due < now():
                due_str = crayons.red(due_str)
        else:
            due_str = ' '*25
        
        return due_str

    def status_str(self):
        s = Status(self.d.get('status',0))
        return '{:10s}'.format(s.name)




