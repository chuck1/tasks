#!/usr/bin/env python3

import os
import boto3
import json
import pymake

DIR = os.path.dirname(__file__)

def touch(fname, mode=0o666, dir_fd=None, **kwargs):
    flags = os.O_CREAT | os.O_APPEND
    with os.fdopen(os.open(fname, flags=flags, mode=mode, dir_fd=dir_fd)) as f:
        os.utime(f.fileno() if os.utime in os.supports_fd else fname, dir_fd=None if os.supports_fd else dir_fd, **kwargs)

       
def upload(resource, bucket, key, filename):
    print(key)
    res = resource.Object(bucket, key).put(Body=open(filename, 'rb'), ACL='public-read', ContentType="text/html")

if __name__ == '__main__':

    resource = boto3.resource('s3')
    bucket = "todo-static-site"

    for root, dirs, files in os.walk('website'):
        for filename in files:
            filename = os.path.relpath(os.path.join(root, filename),'website')
            upload(resource, bucket, filename, os.path.join('website', filename))

    upload(resource, bucket, 'js/markdown/markdown.js', 'node_modules/markdown/lib/markdown.js')

