__version__ = '0.1'
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
    if d is None: return "None"
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

class Status(enum.Enum):
    NONE = 0
    COMPLETE = 1
    CANCELLED = 2

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

def SafeChild(task):
    print("SafeChild")
    print(task)
    return {
        "id": str(task["id"]),
        "due_last": datetimeToString(task["due_last"])
        }

def SafePost(session, post):
    user = session.db.users.find_one(session.filter_id(post["user_id"]))
    return {
            "user_id": str(post["user_id"]),
            "user_username": user["username"],
            "datetime": datetimeToString(post["datetime"]),
            "text": post["text"]
            }

def safeTask(task):
    
    print(task)
 
    def func_due_elem(elem):
        elem['value'] = datetimeToString(elem["value"])

    def func_status_elem(elem):
        elem["value"] = Status(elem["value"]).name
   
    return {
            "_id": str(task["_id"]),
            "creator": str(task["creator"]),
            "dt_create": datetimeToString(task.get("dt_create", None)),
            "title": task["title"],
            "tags": task.get("tags", []),
            "isContainer": task.get("isContainer", False),
            "parent": str(task.get("parent", None)),
            "due": [func_due_elem(elem) for elem in task["due"]],
            "status": [func_status_elem(elem) for elem in task["status"]],
            "due_last": datetimeToString(task["due_last"]),
            "status_last": Status(task["status_last"]).name,
            "due2": datetimeToString(task.due2()),
            "children": [SafeChild(child) for child in task.get("children", [])],
            "posts": list(task.posts()),
            }
 
def safeBranch(branch):
    return {"task": safeTask(branch["task"]), "tree": safeDict(branch["tree"])}

def safeDict(subtree):
    return collections.OrderedDict((str(task_id), safeBranch(branch)) for task_id, branch in subtree.items())

class TaskTree:
    def __init__(self, session, tasks):
        self.session = session
        self.tree = collections.OrderedDict()
        
        self.flat = tasks
        
        for t_id, t in tasks.items():
            self.get(t['_id'])
            
            assert isinstance(t, _Task)

            print("due_last: {:24} due2: {:24}".format(str(t["due_last"]), str(t.due2())))

        def func(tree):
            return collections.OrderedDict(sorted(tree.items(), key=lambda elem: elem[1]["task"]))
        
        self.iter(func)

    def _iter(self, tree, func):
        for t_id, branch in tree.items():
            branch["tree"] = self._iter(branch["tree"], func)

        return func(tree)

    def iter(self, func):
        self.tree = self._iter(self.tree, func)

    def get_task(self, task_id):
        #if task_id in self.flat:
        return self.flat[task_id]

        task = self.session.db.tasks.find_one({'_id': task_id})
        task['due_last'] = task['due'][-1]['value']
        task['status_last'] = task['status'][-1]['value']

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

    def task_due2(self, task):
        due = task["due_last"]
    
        if due is not None: return due
    
        children = task.get("children", [])
        
        if not children: return due
        
        l2 = [self.get_task(child_id) for child_id in children]
        l3 = [task['due_last'] for task in l2 if task['due_last'] is not None]

        if not l3: return due

        return min(l3)#, key=lambda task: task['due_last'])
 
def migrate1(s):
    for task in s.find({}):
        print('migrate', task['_id'])
        #due_new = [{"value":task["due"]}]
        
        #s.db.tasks.update_one({"_id":task["_id"]}, {"$set": {"due": due_new}})

class Session:
    """
    elements of the task record

    * title - string
    * creator - ObjectID of user
    * due - datetime object
    * status - integer

    """

    fields = [
            'title',
            'creator',
            'dt_create',
            'due',
            'status',
            'parent',
            'isContainer',
            "posts",
            ]

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

        print("Create task")
        print(due)
        print(due_utc)

        t = {
                'title': title,
                'creator': self.user['_id'],
                'dt_create': utcnow(),
                'due': [{"value": due_utc},],
                'status': [{"value": Status.NONE.value},],
                'parent': parent_id,
                }
    
        return self.db.tasks.insert_one(t)

    def agg_due_last(self, fields=[]):
        yield {"$project": dict([("due_last", {"$arrayElemAt": ["$due", -1]}) ] + [(f, 1) for f in self.fields + fields])}
        yield {"$project": dict([("due_last", "$due_last.value")] + [(f, 1) for f in self.fields + fields])}

    def agg_status_last(self):
        yield {"$project": dict([("status_last", {"$arrayElemAt": ["$status", -1]}) ] + [(f, 1) for f in self.fields])}
        yield {"$project": dict([("status_last", "$status_last.value")] + [(f, 1) for f in self.fields])}
    
    def agg_status_last_none(self):
        yield {"$match": {"status_last": Status.NONE.value}}
    
    def agg_sort_due(self):
        yield {"$sort": {"due_last": 1}}

    def agg_default(self):
        yield from self.agg_status_last()
        yield from self.agg_due_last(['status_last'])
        yield from self.agg_status_last_none()
        yield from self.agg_sort_due()

    def task_view_default(self):

        vc = self.view_children()
        
        c = self.aggregate(list(self.agg_default()))
        
        tasks = dict((t["_id"], _Task(self, t)) for t in c)
        
        for elem in vc:
            print('elem:',elem)
            if elem["_id"] not in tasks.keys():
                task = self.session.db.tasks.find_one({'_id': elem["_id"]})
                task['due_last'] = task['due'][-1]['value']
                task['status_last'] = task['status'][-1]['value']
                tasks[elem["_id"]] = task

            tasks[elem["_id"]]["children"] = elem["children"]
       
        return tasks

    def task_delete(self, task_id):
        self.db.tasks.delete_one(self.filter_id(task_id))

    def taskPushPost(self, task_id, text):
        elem = {
                "user_id": self.user["_id"],
                "datetime": utcnow(),
                "text": text,
                }

        self.db.tasks.update_one(self.filter_id(task_id), {"$push": {"posts": elem}})

    def view_children(self):
        def _stages():
            yield from self.agg_status_last()
            yield from self.agg_status_last_none()
            yield from self.agg_due_last(['status_last'])
            yield {"$match": {"parent": {"$ne": None}}}
            yield {"$group": {"_id": "$parent", "children": {"$push": {"id": "$_id", "due_last": "$due_last"}}}}

        return self.aggregate(list(_stages()))

    def aggregate(self, stages):
        for task in self.db.tasks.aggregate(stages):
            yield task

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

    def tree(self, tasks):
        #return TaskTree(self, self.db.tasks.find(filt).sort('due', pymongo.ASCENDING))
        return TaskTree(self, tasks)

    def delete_many(self, filt):
        return self.db.tasks.delete_many(filt)

    def updateStatus(self, filt, status):
        """
        update the status of all tasks whose title matches the regex
        """
        assert isinstance(status, Status)
        elem = {"value": status.value, "dt": utcnow()}
        self.db.tasks.update_many(filt, {'$push': {'status': elem}})

    def updateTitle(self, filt, title):
        self.db.tasks.update_many(filt, {'$set': {'title': title}})

    def updateIsContainer(self, filt, val):
        self.db.tasks.update_many(filt, {'$set': {'isContainer': val}})

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
        elem = {"value": due, "dt": utcnow()}
        self.db.tasks.update_many(filt, {'$push': {'due': elem}})
 
    def show(self, filt):
        
        print(("{{:24}} {{:25}} {{:11}}{{:{}}} {{}}").format(_Task.column_width['title']).format("id", "due", "status", "title", "tags"))

        for t in self.find(filt):

            t = _Task(self, t)
            id_str = str(t.d['_id']) + ' '
            str_title = crayons.white("{:48} ".format(t.d['title'][:48]), bold=True)
            str_tags = "{:32}".format(str(', '.join(t.d.get('tags',[])))[:32])

            print(id_str + t.due_str() + t.status_str() + str_title + str_tags)
 
    def iter_tree(self, tasks):
        yield from self._iter_tree(self.tree(tasks).tree)

    def _iter_tree(self, tree, level=0):
        
        for t_id, branch in tree.items():
            t = branch["task"]
            
            yield t, level
            
            yield from self._iter_tree(branch["tree"], level + 1)
   
    def show_tree(self, tasks):
        for task, level in self.iter_tree(tasks):
            self.show_tasks([task], level)

    def show_tasks(self, tasks, level):
        
        for t in tasks:
            assert t is not None

            t = _Task(self, t)

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
    
    def __init__(self, session, d):
        self.session = session
        self.d = d
    
    def __getitem__(self, key):
        return self.d[key]
    
    def __setitem__(self, key, value):
        self.d[key] = value
    
    def get(self, key, default):
        return self.d.get(key, default)

    def __lt__(self, other):
        if other.due2() is None: return True
        if self.due2() is None: return False
        return self.due2() < other.due2()

    def posts(self):
        for post in self.d.get("posts", []):
            yield SafePost(self.session, post)
        
    def due2(self):
        due = self.d["due_last"]
    
        if due is not None: return due
    
        children = self.d.get("children", [])
        
        if not children: return due
        
        l3 = [elem['due_last'] for elem in children if elem['due_last'] is not None]

        if not l3: return due

        return min(l3) #, key=lambda task: task['due_last'])

    def due_str(self):
        due = self.d['due_last']
        due = self.due2()
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
        s = Status(self.d.get('status_last',0))
        return '{:11s}'.format(s.name)




