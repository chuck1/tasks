# todo

The Todo project has the following parts

* Data stored as json documents in a Mongo database
* A python package with functions for interacting with the database using pymongo
* An AWS Lambda function that receives REST API requests, uses the todo python packagem and returns results
* An AWS API Gateway API
* A static website hosted on AWS S3. Uses javascript to send requests to the REST API.

## Web application

I have begun to implement a web application frontend for todo using various AWS services, most importantly Lambda.
In this repository you will find a lambda function which calls todo function and returns results as a REST API response.
In order to deploy this lambda functin, you must upload a zip file with the required packages.
This zip file is created by running

    bash script/deploy.bash

The static files for the website are under the "website" folder.
The "upload\_website.py" script uploads all of these files to S3.

[This tutorial](https://aws.amazon.com/getting-started/serverless-web-app/) was very helpful.
Other useful pages: [](http://docs.aws.amazon.com/cognito/latest/developerguide/using-amazon-cognito-identity-user-pools-javascript-example-authenticating-admin-created-user.html).


Issues I encountered:

* the lambda function must return a valid API response and in the header section it must have a "Access-Control-Allow-Origin" value.
* In Cognito, it appears that you cannot use the email address as the username exactly, but you can replace "@" with "-at-" for the username.
* needed to allow connection from any IP in mongodb atlas

## Data structure

### Task

#### title

A string.

#### due

A string representing a UTC date-time or none.

#### parent

A bson ID object referencing a parent task or none.
Not to be confused with a predecessor.
A parent is used to group tasks together for viewing.

#### status

An integer corresponding to value in the `todo.Status` enum.



