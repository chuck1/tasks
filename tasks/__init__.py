__version__ = '0.1'
import argparse
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
from .status import *
import tasks.session

def clean(args):
    c = pymongo.MongoClient()
    for s in c.database_names():
        m = re.match('test_\d{10}', s)
        if m:
            print(s)
            c.drop_database(s)

def dump(args):
    session = tasks.session.Session(args.db, 'charlesrymal-at-gmail.com')
    
    for t in session.db.tasks.find({}):
        for k, v in t.items():
            if k in ['due', 'status']:
                v = v[-1]['value']

            print(f'{k:16} {v!r}')

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

    args = parser.parse_args(av)
    args.func(args)





