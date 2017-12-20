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

       
def upload(resource, bucket, filename):
    res = resource.Object(bucket, filename).put(Body=open(os.path.join('website', filename), 'rb'), ACL='public-read', ContentType="text/html")

if __name__ == '__main__':

    resource = boto3.resource('s3')
    bucket = "todo-static-site"

    for root, dirs, files in os.walk('website'):
        for filename in files:
            filename = os.path.relpath(os.path.join(root, filename),'website')
            print(filename)
            upload(resource, bucket, filename)


