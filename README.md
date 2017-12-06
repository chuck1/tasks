# todo

Todo is a python package with tools for viewing and manipulating a task database.
The database is a mongodb, accessed using pymongo.

## Web application

I have begun to implement a web application frontend for todo using various AWS services, most importantly Lambda.
In this repository you will find a lambda function which calls todo function and returns results as a REST API response.
In order to deploy this lambda functin, you must upload a zip file with the required packages.
This zip file is created by running

    bash script/deploy.bash

Amazon serives used:

* Lambda
* API Gateway
* Cognito
* S3

[This tutorial](https://aws.amazon.com/getting-started/serverless-web-app/) was very helpful.
Other useful pages: [](http://docs.aws.amazon.com/cognito/latest/developerguide/using-amazon-cognito-identity-user-pools-javascript-example-authenticating-admin-created-user.html).


Issues I encountered:

* the lambda function must return a valid API response and in the header section it must have a "Access-Control-Allow-Origin" value.
* In Cognito, it appears that you cannot use the email address as the username exactly, but you can replace "@" with "-at-" for the username.
* needed to allow connection from any IP in mongodb atlas



