import os
import re
import json
from setuptools import setup

c = {'name':'tasks',
        'description':'',
        'url':'github.com/chuck1/todo',
        'author':'charles rymal',
        'author_email':'',
        'license':'',
        }


kwargs = {
        'name': 'todo',
        'version': '0.1',
        'description': c['description'],
        'url': c['url'],
        'author': c['author'],
        'author_email': c['author_email'],
        'license': c['license'],
        'packages': ['tasks'],
        'zip_safe': False,
        'install_requires': [
            ],
        }

setup(**kwargs)



