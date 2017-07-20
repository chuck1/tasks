import re
from setuptools import setup

with open('todo/__init__.py') as f:
    version = re.findall("^__version__ = '(.*)'", f.read())[0]

setup(name='pymake',
        version=version,
        author='Charles Rymal',
        author_email='charlesrymal@gmail.com',
        license='MIT',
        packages=[
            'todo',
            ],
        scripts=['bin/todo'],
        zip_safe=False,
        )

