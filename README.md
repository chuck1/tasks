# todo

Todo is a python package with tools for viewing and manipulating a task database.
The database is a mongodb, accessed using pymongo.

## Web application

I have begun to implement a web application frontend for todo using various AWS services, most importantly Lambda.
In this repository you will find a lambda function which calls todo function and returns results as a REST API response.
In order to deploy this lambda functin, you must upload a zip file with the required packages.
This zip file is created by running

    bash script/deploy.bash


