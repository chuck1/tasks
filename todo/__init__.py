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

def datetimeToString(d):
    if d is None: return "None"
    d = d.astimezone(pytz.utc)
    return d.strftime("%Y-%m-%d %H:%MZ")

def stringToDatetime(s):
    if s:
        naive = datetime.datetime.strptime(s, "%Y-%m-%d %H:%MZ")
        return pytz.utc.localize(naive)
    else:
        return None


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

"""
tree = {
    <task id>: {
        "task": <task>,
        "tree": {...}
        }
    }
"""

def stringize_field(task, name):
    if task.get(name, None) is not None:
        task[name] = str(task[name])


def safeTask(task):

        task = dict(task)
        
        stringize_field(task, '_id')
        stringize_field(task, 'creator')
        
        task["parent"] = str(task.get("parent", None)) 

        task["due"] = datetimeToString(task["due"])

        task["status"] = Status(task["status"]).name
        
        print(task)

        return task

def safeBranch(branch):
    return {"task": safeTask(branch["task"]), "tree": safeDict(branch["tree"])}

def safeDict(subtree):
    return collections.OrderedDict((str(task_id), safeBranch(branch)) for task_id, branch in subtree.items())

class TaskTree:
    def __init__(self, session, tasks):
        self.session = session
        self.tree = collections.OrderedDict()

        self.flat = dict()

        for t in tasks:
            self.get(t['_id'])
    
    def get_task(self, task_id):
        if task_id in self.flat:
            return self.flat[task_id]

        task = self.session.db.tasks.find_one({'_id': task_id})

        self.flat[task_id] = task
        
        return task

    def get(self, t_id):
        
        t = self.get_task(t_id)

        p = t.get('parent', None)

        if p is None:
            d = self.tree
        else:
            d = self.get(p)
        
        if t_id not in d.keys():
            d[t_id] = {
                    "task": t,
                    "tree": collections.OrderedDict()}

        return d[t_id]["tree"]

        

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
            raise RuntimeError()
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

    def updateStatus(self, filt, status):
        """
        update the status of all tasks whose title matches the regex
        """
        assert isinstance(status, Status)
        self.db.tasks.update_many(filt, {'$set': {'status': status.value}})

    def updateTitle(self, filt, title):
        """
        update the status of all tasks whose title matches the regex
        """
        self.db.tasks.update_many(filt, {'$set': {'title': title}})

    def updateParent(self, filt, parent_id_str):
        if not parent_id_str:
            parent_id = None
        elif parent_id_str == "None":
            parent_id = None
        else:
            parent_id = bson.objectid.ObjectId(parent_id_str)

        self.db.tasks.update_many(filt, {'$set': {'parent': parent_id}})
 
    def updateDue(self, filt, due):
        due = due.astimezone(pytz.utc) if due is not None else None
        self.db.tasks.update_many(filt, {'$set': {'due': due}})
 
    def show(self, filt):
        
        print(("{{:24}} {{:25}} {{:11}}{{:{}}} {{}}").format(_Task.column_width['title']).format("id", "due", "status", "title", "tags"))

        for t in self.find(filt):

            t = _Task(t)
            id_str = str(t.d['_id']) + ' '
            str_title = crayons.white("{:48} ".format(t.d['title'][:48]), bold=True)
            str_tags = "{:32}".format(str(', '.join(t.d.get('tags',[])))[:32])

            print(id_str + t.due_str() + t.status_str() + str_title + str_tags)
 
    def iter_tree(self, filt=None):
        if filt is None:
            filt = self.filter_open()

        yield from self._iter_tree(self.tree(filt).tree)

    def _iter_tree(self, tree, level=0):
        
        for t_id, branch in tree.items():
            t = branch["task"]
            
            yield t, level
            
            yield from self._iter_tree(branch["tree"], level + 1)
   
    def show_tree(self, filt=None):
        for task, level in self.iter_tree(filt):
            self.show_tasks([task], level)

    def show_tasks(self, tasks, level):
        
        for t in tasks:
            assert t is not None

            t = _Task(t)

            id_str = str(t.d['_id']) + ' '
            str_title = crayons.white("{:48} ".format(t.d['title'][:48]), bold=True)
            str_tags = "{:32}".format(str(', '.join(t.d.get('tags',[])))[:32])

            print(id_str + t.due_str() + t.status_str() + ('  ' * level) + str_title + str_tags)

    def add_tag(self, filt, tag):
        self.db.tasks.update(filt, {"$addToSet": {"tags": tag}})

       

def fand(f):
    assert isinstance(f, list)
    return {'$and': f}

class _Task:
    
    column_width = {'title': 48}

    def __init__(self, d):
        self.d = d
    def due_str(self):
        
        due = self.d['due']
        #due_str = '{:26s}'.format(datetimeToString(due))
        
        if due:
            due = pytz.utc.localize(due)
            due_str = '{:26s}'.format(datetimeToString(due))

            if due < now():
                due_str = crayons.red(due_str)
        else:
            due_str = '{:26s}'.format('')
        
        return due_str

    def status_str(self):
        s = Status(self.d.get('status',0))
        return '{:11s}'.format(s.name)




