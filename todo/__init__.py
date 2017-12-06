__version__ = '0.1'
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

class TaskTree:
    def __init__(self, session, tasks):
        self.session = session
        self.tree = collections.OrderedDict()

        for t in tasks:
            self.get(t['_id'])

    def get(self, t_id):
        
        t = self.session.db.tasks.find_one({'_id': t_id})

        p = t.get('parent', None)

        if p is None:
            d = self.tree
        else:
            d = self.get(p)
        
        if t_id not in d.keys():
            d[t_id] = collections.OrderedDict()

        return d[t_id]

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

    def task(self, title, due=None, parent_id=None):
        """
        :param title: title
        :param due: datetime object

        create a new task
        """
        if due is not None:
            due_utc = due.astimezone(pytz.utc)
        else:
            due_utc = None

        if parent_id is not None:
            parent_id = bson.objectid.ObjectId(parent_id)

        print(due)
        print(due_utc)

        t = {
                'title': title,
                'creator': self.user['_id'],
                'due': due_utc,
                'status': Status.NONE.value,
                'parent': parent_id,
                }
    
        return self.db.tasks.insert_one(t)
 
    def filter_open(self):
        return {'status': {'$eq': Status.NONE.value}}
   
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
    
    def tree(self, filt):
        return TaskTree(self, self.db.tasks.find(filt).sort('due', pymongo.ASCENDING))

    def delete_many(self, filt):
        return self.db.tasks.delete_many(filt)

    def update_status(self, filt, status):
        """
        update the status of all tasks whose title matches the regex
        """
        assert isinstance(status, Status)
        self.db.tasks.update_many(filt, {'$set': {'status': status.value}})

    def show(self, filt):
        
        print(("{{:24}} {{:25}} {{:11}}{{:{}}} {{}}").format(_Task.column_width['title']).format("id", "due", "status", "title", "tags"))

        for t in self.find(filt):

            t = _Task(t)
            id_str = str(t.d['_id']) + ' '
            str_title = crayons.white("{:48} ".format(t.d['title'][:48]), bold=True)
            str_tags = "{:32}".format(str(', '.join(t.d.get('tags',[])))[:32])

            print(id_str + t.due_str() + t.status_str() + str_title + str_tags)
    
    def show_tree(self, filt=None):
        if filt is None:
            filt = self.filter_open()

        self._show_tree(self.tree(filt).tree)

    def _show_tree(self, tree, level=0):
        
        for t_id, subtree in tree.items():
            t = self.db.tasks.find_one({'_id': t_id})
            
            self.show_tasks([t], level)
            
            self._show_tree(subtree, level + 1)

    def show_tasks(self, tasks, level):
        
        for t in tasks:

            t = _Task(t)
            id_str = str(t.d['_id']) + ' '
            str_title = crayons.white("{:48} ".format(t.d['title'][:48]), bold=True)
            str_tags = "{:32}".format(str(', '.join(t.d.get('tags',[])))[:32])

            print(id_str + t.due_str() + t.status_str() + ('  ' * level) + str_title + str_tags)

    def add_tag(self, filt, tag):
        self.db.tasks.update(filt, {"$addToSet": {"tags": tag}})

    def set_parent(self, filt, id_str):
        self.db.tasks.update_many(filt, {'$set': {'parent': bson.objectid.ObjectId(id_str)}})
        

def fand(f):
    assert isinstance(f, list)
    return {'$and': f}

class _Task:
    
    column_width = {'title': 48}

    def __init__(self, d):
        self.d = d
    def due_str(self):
        due = self.d['due']
        if due:
            due = pytz.utc.localize(due)
            due = due.astimezone(tz)
            due_str = '{:26s}'.format(str(due))

            if due < now():
                due_str = crayons.red(due_str)
        else:
            due_str = '{:26s}'.format('')
        
        return due_str

    def status_str(self):
        s = Status(self.d.get('status',0))
        return '{:11s}'.format(s.name)




