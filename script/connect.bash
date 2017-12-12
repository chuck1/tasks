#!/bin/bash
mongo "mongodb://cluster0-shard-00-00-znoip.mongodb.net:27017,cluster0-shard-00-01-znoip.mongodb.net:27017,cluster0-shard-00-02-znoip.mongodb.net:27017/test?replicaSet=Cluster0-shard-0" --ssl --authenticationDatabase admin --username chuck --password $MONGO_PASSWORD
