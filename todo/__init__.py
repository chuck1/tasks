__version__ = '0.1a0'
import datetime
import json
import sys
import re

import pytz
import bson
import bson.json_util
import crayons

prompt = '> '
me = 'charles'

class Status:
    OPEN = 0
    CANCELLED = 1
    COMPLETE = 2

class Person:
    def __init__(self, username):
        self.username = username

# sample task layout
sample_task = {
        'title': '',
        'tags': [],
        'createdby': 'charles',
        'assigned': ['charles'],
        'created': datetime.datetime.utcnow(),
        'due': None,
        'status': Status.OPEN
        }

class Database:
    filename = 'db.json'
    def read(self):
        with open(self.filename) as f:
            _ = json.load(f, object_hook=bson.json_util.object_hook)
        self.tasks = _['tasks']
        self.people = _['people']
    
    def write(self):
        with open(self.filename, 'w') as f:
            json.dump({'tasks':self.tasks, 'people':self.people}, f, indent=8, default=bson.json_util.default)

    def add_task(self, title, createdby, assigned, tags, due):
        t = {}
        
        t['title'] = title
        t['createdby'] = createdby
        t['assigned'] = assigned
        t['tags'] = tags
        t['due'] = due

        t['created'] = datetime.datetime.utcnow()
        t['status'] = Status.OPEN

        self.tasks.append(t)
        print(crayons.blue('task created'))
        print('  {}'.format(title))
        
    def get_person(self, username):
        for p in self.people:
            if p['username'] == username:
                return p
        raise KeyError()

    def filter(self, assigned, none_assigned):
        for t in self.tasks:
            if none_assigned:
                if not t.get('assigned', []):
                    yield t
            else:
                for a in assigned:
                    if a not in t.get('assigned', []):
                        continue
                yield t

db = Database()
db.read()


commands = {}

def command(name, help_lines=[]):
    def wrapper(f):
        def wrapped(*args):
            f(*args)
        commands[name] = wrapped
        return wrapped
    return wrapper

@command('find')
def _find(s, l):
    """
    /assigned [person ...]
      tasks to which the list of people are assigned
    /assigned none
      tasks to which noone is assigned
    """
    l.pop(0)
    assigned = []
    none_assigned = False

    while l:
        if l[0] == '/assigned':
            l.pop(0)
            if l[0] == 'none':
                none_assigned = True
            else:
                while l:
                    if not l[0].startswith('@'):
                        break

                    a = l.pop(0)[1:]
                
                    try:
                        db.get_person(a)
                    except KeyError as e:
                        print(crayons.red('user not found: {}'.format(a)))
                        return

                    assigned.append(a)

        break

    _list2(db.filter(assigned, none_assigned))

def _list2(tasks):
    for t in tasks:
        print(t['title'])
        if t.get('createdby', None):
            print('  createdby: {}'.format(t['createdby']))
        if t.get('assigned', []):
            print('  assigned:  {}'.format(' '.join(t['assigned'])))
        if t.get('tags', []):
            print('  tags:      {}'.format(' '.join(t['tags'])))
        if t.get('due', None):
            print('  due:       {}'.format(t['due'].astimezone(tz)))

@command('list')
def _list(s, l):
    _list2(db.tasks)

@command('help')
def _help(s, l):
    print('To create a task simply write the title of the task.')
    print('Prepend the title with...')
    print('  @username to assign to people')
    print('  #tagname to add tags')
    print('Append \'by <time or duration description>\' to add due date')
    print('commands:')
    for k in commands.keys():
        print('  /' + k)

_prefix = ''

@command('pre')
def _pre(s, l):
    global _prefix
    l.pop(0)
    s = ' '.join(l)
    print('setting pre to: {}'.format(repr(s)))
    _prefix = s

tz = pytz.timezone('US/Pacific')
utc = datetime.timezone.utc

def _now():
    return datetime.datetime.now(utc)

offset = tz.utcoffset(datetime.datetime.utcnow())

dow = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

def process_due_date(s):
    now = _now()
    
    pat = re.compile('.* by (Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)')
    m = pat.match(s)
    if m:
        print('matched ', pat)
        g = m.groups()
        print(g)

        d = dow.index(g[0]) - now.date().weekday()

        if d < 0:
            d = d + 7
        elif d == 0:
            d = 7

        print('d =',d)
        
        dt = datetime.datetime.combine(now.date() + datetime.timedelta(days=d), datetime.time(9, tzinfo=utc)) - offset
        dt = dt.astimezone(tz)
        return dt

    return None

def add_task(s, l):

    l = _prefix.split(' ') + l

    people = []
    tags = []

    while True:
        if l[0].startswith('@'):
            a = l.pop(0)[1:]
            
            try:
                db.get_person(a)
            except KeyError as e:
                print(crayons.red('user not found: {}'.format(a)))
                return

            people.append(a)

        elif l[0].startswith('#'):
            a = l.pop(0)[1:]

            tags.append(a)
        else:
            break

    if not l:
        print(crayons.red('title missing'))
        return
    
    s = ' '.join(l)

    due = process_due_date(s)

    title = s
    
    db.add_task(title, me, people, tags, due)

def process(s):
    if s == '':
        return

    l = s.split(' ')
    if l[0][0] == '/':
        c = l[0][1:]
        if c not in commands:
            print(crayons.red('unrecognized command: {}'.format(c)))
            return
        return commands[c](s, l)
    return add_task(s, l)

def main(argv):
    logo = '\n'.join([
            '   ______      ____       ',
            '  /_  __/___  / __ \____  ',
            '   / / / __ \/ / / / __ \ ',
            '  / / / /_/ / /_/ / /_/ / ',
            ' /_/  \____/_____/\____/  '])
    
    print('{logo}'.format(logo=logo))
    print('Welcome to the interactive shell')
    print('tz: {}'.format(tz))
    print('type /help for help')
    while True:
        try:
            process(input(_prefix + prompt))
        except EOFError as e:
            break
    
    db.write()
    print('\ngoodbye')


