import datetime
import json
import os
import traceback
import pytz

import bson
import pymongo

import elephant
import tasks.session

def breakpoint():
    import pdb;pdb.set_trace();

def errorResponse(err, responseBody):
    return {
        "statusCode": 400,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(traceback.format_exc()),
        "isBase64Encoded": False}

class Handler:
    def __init__(self, e_tasks, e_texts):
        self.e_tasks = e_tasks
        self.e_texts = e_texts

    def task_list(self, body):
    
        if body['filter_string']:
            filt = json.loads(body['filter_string'])
        else:
            filt = {}
        
        res = {
                #'tasks': [tasks.safeTask(t) for t in self.session.view_list(filt)],
                'tasks': [tasks.task.Task(self.e_tasks, t).to_array() for t in self.e_tasks.find(filt)],
                }
        return res
    
    def task_create(self, body):
    
        #due = tasks.stringToDatetime(body["due"])
        if body["due"] is None:
            due = None
        else:
            due = datetime.datetime.utcfromtimestamp(body["due"])
        
        res = self.e_tasks.put(None, {
                'title': body["title"], 
                'due': due,
                'parent': body["parent_id"]
                })
    
        res = {'inserted_id': str(res.inserted_id)}
    
        return res
    
    def taskUpdateDue(self, body):
        task_id = body["task_id"]
        due = tasks.stringToDatetime(body["due"])
        self.session.updateDue(self.session.filter_id(task_id), due)
        return "update due success"
    
    def taskUpdateStatus(self, body):
        task_id = body["task_id"]
        status = tasks.Status[body["status"]]
        self.session.updateStatus(self.session.filter_id(task_id), status)
        return "success"
    
    def taskDelete(self, body):
        task_id = body["task_id"]
        self.session.task_delete(task_id)
        return "success"
    
    def taskUpdateTitle(self, body):
        task_id = body["task_id"]
        title = body["title"]
        self.session.updateTitle(self.session.filter_id(task_id), title)
        return "success"
    
    def taskUpdateIsContainer(self, body):
        task_id = body["task_id"]
        self.session.updateIsContainer(self.session.filter_id(task_id), body["isContainer"])
        return "update isContainer success"
    
    def tasks_update_parent(self, body):
        task_id = bson.objectid.ObjectId(body["task_id"])
    
        t0 = self.e_tasks.get_content(task_id)

        t0['parent'] = bson.objectid.ObjectId(body["parent_id_str"])

        self.e_tasks.put(task_id, t0)

        return "success"
    
    def create_comment(self, body):
        self.session.taskPushPost(body["task_id"], body["text"])
    
        return "push post success"
    
    def processBody(self, event, body):
 
        functions = {
                "tasks list": self.task_list,
                "tasks create": self.task_create,
                "update_status": self.taskUpdateStatus,
                "update_title": self.taskUpdateTitle,
                "update_due": self.taskUpdateDue,
                "update_parent": self.tasks_update_parent,
                "update_is_container": self.taskUpdateIsContainer,
                "delete": self.taskDelete,
                #"post": self.taskPushPost,
                }
   
        try:
            command = body["command"]
            f = functions[command]
            return f(body)
        except Exception as e:
            return traceback.format_exc()

def lambda_handler(event, context):
    
    session = None
    responseBody = None

    try:
        body = json.loads(event["body"])
        username = event["requestContext"]["authorizer"]["claims"]['cognito:username']

        db_name_tasks = body['database_tasks']
        db_name_texts = body['database_texts']

        #session = tasks.session.Session(body['database'], username)
        
        client = pymongo.MongoClient(os.environ['MONGO_URI'])

        e_tasks = elephant.database_global.DatabaseGlobal(client[db_name_tasks], "master")
        e_texts = elephant.database_global.DatabaseGlobal(client[db_name_texts], "master")
        
        commands = body['commands']

        handler = Handler(e_tasks, e_texts)
        #handler.texts_engine = jessica.EngineDB('texts_personal')

        responseBody = json.dumps([handler.processBody(event, b) for b in commands])
        
        return {
            "statusCode": 200,
            "headers": {
                'Access-Control-Allow-Origin': '*',
            },
            "body": responseBody,
            "isBase64Encoded": False}

    except Exception as e:
        traceback.print_exc()
        return errorResponse(e, repr(e) + " event: " + str(event))
    
def print_dict(d, level):
    for id_, t in d.items():
        print("-"*level + str(id_))
        print_dict(t.get("children", {}), level+1)

def _test_lambda(commands, database_tasks='test_tasks', database_texts='test_texts'):
    body = {
            'commands': commands,
            'database_tasks': database_tasks,
            'database_texts': database_texts,
            }

    res = lambda_handler({
        "body": json.dumps(body),
        "requestContext": {"authorizer": {"claims": {'cognito:username': 'charlesrymal-at-gmail.com'}}}}, {})

    return res

def test1():
    c = {
        "command": "tasks list",
        "filter_string": "",
        }
    res = _test_lambda([c], database_tasks='tasks1')

    print(res['body'])
    
    data = json.loads(res['body'])[0]
    
    print()
    print(data)
    print()

    task_list = data['tasks']

    for t in task_list:
        print(t)

def test3():
    res0 = _test_lambda([{
			"command": "tasks create",
			"title": "test",
			"due": None,
			"parent_id": None
        }])

    i0 = json.loads(res0['body'])[0]['inserted_id']

    res1 = _test_lambda([{
			"command": "tasks create",
			"title": "test",
			"due": None,
			"parent_id": None
        }])

    i1 = json.loads(res1['body'])[0]['inserted_id']

    res2 = _test_lambda([{
        "command": "update_parent",
        "task_id": i0,
        "parent_id_str": i1,
        }])

    print(res2)

def test2(session):
    print('test2')

    res = session.task('test', None, None)

    print(res)


def test():
    test3()
    #test1()
    
    #session = tasks.session.Session('test', 'charlesrymal-at-gmail.com')
    #test2(session)






