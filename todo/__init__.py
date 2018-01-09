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

from .todo_datetime import *
from .session import *

class Status(enum.Enum):
    NONE = 0
    COMPLETE = 1
    CANCELLED = 2


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
            "children": dict((str(id_), safeTask(child)) for id_, child in task.get("children", {}).items()),
            "posts": list(task.posts()),
            }
 
def safeBranch(branch):
    return {"task": safeTask(branch["task"]), "tree": safeDict(branch["tree"])}

def safeDict(subtree):
    return collections.OrderedDict((str(task_id), safeTask(t)) for task_id, t in subtree.items())

class TaskTree:
    def __init__(self, session, tasks):
        self.session = session
        self.tree = collections.OrderedDict()
        
        self.flat = tasks
        
        for t_id, t in tasks.items():
            self.get(t['_id'])
            
            if not isinstance(t, _Task):
                raise RuntimeError("t should be _Task, is {}".format(repr(t)))

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

def migrate1(s):
    for task in s.find({}):
        print('migrate', task['_id'])
        #due_new = [{"value":task["due"]}]
        
        #s.db.tasks.update_one({"_id":task["_id"]}, {"$set": {"due": due_new}})


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
        if other['due_last'] is None: return True
        if self.d['due_last'] is None: return False
        return self.d['due_last'] < other['due_last']

    def posts(self):
        for post in self.d.get("posts", []):
            yield SafePost(self.session, post)
    
    def due_str(self):
        due = self.d['due_last']
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




