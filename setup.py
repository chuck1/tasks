import os
import re
import json
from setuptools import setup

c = {'name':'todo',
        'description':'',
        'url':'github.com/chuck1/todo',
        'author':'charles rymal',
        'author_email':'',
        'license':'',
        }

with open(os.path.join(c['name'], '__init__.py')) as f:
    version = re.findall("^__version__ = '(.*)'", f.read())[0]

kwargs = {
        'name': 'todo',
        'version': version,
        'description': c['description'],
        'url': c['url'],
        'author': c['author'],
        'author_email': c['author_email'],
        'license': c['license'],
        'packages': ['todo'],
        'zip_safe': False,
        'install_requires': [],
        }

setup(**kwargs)



