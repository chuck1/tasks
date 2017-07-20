__version__ = '0.1a0'
import datetime
import json
import sys

import crayons

prompt = '> '

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
        'assigned': ['charles'],
        'created': datetime.datetime.utcnow(),
        'due': None,
        'status': Status.OPEN
        }

class Database:
    filename = 'db.json'
    def read(self):
        with open(self.filename) as f:
            _ = json.load(f)
        self.tasks = _['tasks']
        self.people = _['people']
    
    def write(self):
        with open(self.filename, 'w') as f:
            json.dump({'tasks':self.tasks, 'people':self.people}, f, indent=8)

    def add_task(self, title, assigned):
        t = {}
        t['title'] = title
        t['assigned'] = assigned
        self.tasks.append(t)
        print('task add to database', t)

    def get_person(self, username):
        for p in self.people:
            if p['username'] == username:
                return p
        raise KeyError()

db = Database()
db.read()

me = 'charles'

commands = {}

def command(name):
    def wrapper(f):
        def wrapped(*args):
            f(*args)
        commands[name] = wrapped
        return wrapped
    return wrapper

@command('list')
def _list(s, l):
    print('Tasks:')
    for t in db.tasks:
        print(t['title'])

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

def add_task(s, l):
    print('add task:', s, l)
    people = []
    while l[0].startswith('@'):
            a = l.pop(0)[1:]
            
            try:
                db.get_person(a)
            except KeyError as e:
                print(crayons.red('user not found: {}'.format(a)))
                return

            people.append(a)
    
    if not l:
        print(crayons.red('title missing'))
        return

    title = ' '.join(l)
    db.add_task(title, people)

def process(s):
    l = s.split(' ')
    print('s=',s)
    print('l=',l)
    if l[0][0] == '/':
        if l[0] not in commands:
            print('unrecognized command:', l[0])
        return commands[l[0][1:]](s, l)
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
    print('type /help for help')
    while True:
        try:
            process(input(prompt))
        except KeyboardInterrupt as e:
            break
        except EOFError as e:
            break
    
    db.write()
    print('\ngoodbye')


