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
        
        flat = dict((t["_id"], _Task(self, t)) for t in c)
        
        def _get_task(id_):
            if id_ not in flat.keys():
                task = self.db.tasks.find_one({'_id': elem["_id"]})
                #task['due_last'] = task['due'][-1]['value']
                #task['status_last'] = task['status'][-1]['value']
                    
                flat[id_] = _Task(self, task)
            
            return flat[id_]

        for elem in vc:
            t = _get_task(elem["_id"])
            
            print("elem[\"children\"]")
            print(elem["children"])

            t["children"] = dict((child["id"], _get_task(child["id"])) for child in elem["children"])
       
        for t in flat.values():
            assert isinstance(t, _Task)
        
        tasks = flat

        return collections.OrderedDict((id_, t) for id_, t in tasks.items() if t.get("parent", None) is None)

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

       

