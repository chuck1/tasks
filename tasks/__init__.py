__version__ = '0.1'
import argparse
import functools
import collections
import json
import os
import time
import datetime
import pprint
import re
import enum

import crayons
import pytz
import pymongo
import bson

import tasks.session

def clean(args):
    c = pymongo.MongoClient()
    for s in c.database_names():
        m = re.match('test_\d{10}', s)
        if m:
            print(s)
            c.drop_database(s)

def process_post(post):
    for k, v in post.items():
        if k == 'user_id':
            v = str(v)
        if k == 'datetime':
            v = str(v)

        yield k, v

def process_posts(posts):
    for p in posts:
        yield dict(process_post(p))

def process_task(t):
    for k, v in t.items():
        if k in ['due', 'status']:
             v = v[-1]['value']
        
        if k == 'dt_create':
            v = str(v)
        if k == 'due':
            v = str(v)

        if isinstance(v, bson.objectid.ObjectId):
            v = str(v)

        if k == 'posts':
            v = list(process_posts(v))

        yield k, v

def process_tasks(tasks):
    for t in tasks:
        t1 = dict(process_task(t))
        yield t1

def dump(args):
    session = tasks.session.Session(args.db, 'charlesrymal-at-gmail.com')
    
    task_list = list(process_tasks(session.db.tasks.find({})))

    pprint.pprint(task_list)
    
    with open('dump.json', 'w') as f:
        json.dump(task_list, f)

def restore(args):

def main(av):
    
    parser = argparse.ArgumentParser()

    def _help(args):
        parser.print_usage()

    parser.set_defaults(func=_help)

    subparsers = parser.add_subparsers()

    parser_dump = subparsers.add_parser('dump')
    parser_dump.add_argument('db')
    parser_dump.set_defaults(func=dump)

    parser_clean = subparsers.add_parser('clean')
    parser_clean.set_defaults(func=clean)

    parser_restore = subparsers.add_parser('restore')
    parser_restore.set_defaults(func=clean)

    args = parser.parse_args(av)
    args.func(args)





