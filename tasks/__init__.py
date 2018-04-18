__version__ = '0.1'
import argparse
import datetime
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
import elephant.database_global
import tasks.session

def breakpoint(): import pdb; pdb.set_trace();

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

        if isinstance(v, datetime.datetime):
            v = v.timestamp()

        yield k, v

def process_posts(posts):
    for p in posts:
        yield dict(process_post(p))

def process_task(t):
    for k, v in t.items():
        if k in ['due', 'status']:
             v = v[-1]['value']
        
        if isinstance(v, datetime.datetime):
            v = v.timestamp()

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
    #session = tasks.session.session(args.db, 'charlesrymal-at-gmail.com')

    client = pymongo.MongoClient(os.environ["MONGO_URI"])

    e = elephant.database_global.DatabaseGlobal(client[args.db], "master")
    e_texts = elephant.database_global.DatabaseGlobal(client[args.db_texts], "master")

    with open('dump.json') as f:
        task_list0 = json.load(f)
    
    # for testing
    if False:
        task_list = task_list0[:3]

        for t in task_list0:
            if 'posts' in t:
                if t in task_list:
                    break
    
                task_list.append(t)
                break
    
        for t in task_list:
            if 'parent' in t:
                for t0 in task_list0:
                    if t0['_id'] == t['parent']:
                        task_list.append(t0)
    else:
        task_list = task_list0

    id_map = {}

    i = 0
    for t in task_list:
        print(f'{i}/{len(task_list)}')
        i+=1

        t1 = dict(t)
        del t1['_id']
        if 'posts' in t1:
            del t1['posts']
        if 'parent' in t1:
            del t1['parent']
        if 'dt_create' in t1:
            del t1['dt_create']
        
        if 'due' in t1:
            if t1['due'] is not None:
                t1['due'] = datetime.datetime.utcfromtimestamp(t1['due'])

        res = e.put(None, t1)

        print(res.inserted_id)

        id_map[t['_id']] = res.inserted_id

    i = 0
    for t in task_list:
        print(f'{i}/{len(task_list)}')
        i+=1

        id_new = id_map[t['_id']]

        if 'parent' in t:
            if t['parent'] is not None:

                t0 = e.get_content(id_new)

                if t['parent'] not in id_map:
                    print(crayons.yellow('parent not found'))
                    continue

                t0['parent'] = id_map[t['parent']]
            
                e.put(id_new, t0)
        
                # for debug
                t0 = e.get_content(id_new)
                pprint.pprint(t0)

        if 'posts' in t:
            
            for p in t['posts']:

                p0 = {
                        'task': id_new,
                        'tags': ['comment'],
                        'text': p['text'],
                        }

                res = e_texts.put(None, p0)

                # for debug
                p1 = e_texts.get_content(res.inserted_id)

                pprint.pprint(p1)


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
    parser_restore.add_argument('db')
    parser_restore.add_argument('db_texts')
    parser_restore.set_defaults(func=restore)

    args = parser.parse_args(av)
    args.func(args)





