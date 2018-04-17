import datetime
import json
import traceback
import pytz

import tasks.session

def breakpoint():
    import pdb;pdb.set_trace();

class Handler:

    def task_list(self, body):
    
        if body['filter_string']:
            filt = json.loads(body['filter_string'])
        else:
            filt = {}
    
        res = {
                'tasks': [tasks.safeTask(t) for t in self.session.view_list(filt)],
                }
        return res
    
    def taskCreate(self, body):
    
        due = tasks.stringToDatetime(body["due"])
        
        task = self.session.task(
                body["title"], 
                due,
                body["parent_id"], )
    
        assert task is not None
    
        res = {'task': tasks.safeTask(task)}
    
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
    
    def taskUpdateParent(self, body):
        task_id = body["task_id"]
        parent_id_str = body["parent_id_str"]
        self.session.updateParent(self.session.filter_id(task_id), parent_id_str)
        return "success"
    
    def create_comment(self, body):
        self.session.taskPushPost(body["task_id"], body["text"])
    
        
    
        return "push post success"
    
def errorResponse(err, responseBody):
    return {
        "statusCode": 400,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(traceback.format_exc()),
        "isBase64Encoded": False}

functions = {
        "list": taskList,
        "list 1": task_list,
        "create": taskCreate,
        "update_status": taskUpdateStatus,
        "update_title": taskUpdateTitle,
        "update_due": taskUpdateDue,
        "update_parent": taskUpdateParent,
        "update_is_container": taskUpdateIsContainer,
        "delete": taskDelete,
        "post": taskPushPost,
        }

    def processBody(self, event, body):
    
        try:
            command = body["command"]
            f = functions[command]
            return f(session, body)
        except Exception as e:
            return traceback.format_exc()

def lambda_handler(event, context):
    
    session = None
    responseBody = None

    try:
        body = json.loads(event["body"])
        username = event["requestContext"]["authorizer"]["claims"]['cognito:username']

        session = tasks.session.Session(body['database'], username)
        
        commands = body['commands']

        handler = Handler()
        handler.session = session
        handler.texts_engine = jessica.EngineDB('texts_personal')

        responseBody = json.dumps([processBody(event, session, b) for b in commands])
        
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

def _test_lambda(commands, database='test'):
    body = {
            'commands': commands,
            'database': database,
            }

    res = lambda_handler({
        "body": json.dumps(body),
        "requestContext": {"authorizer": {"claims": {'cognito:username': 'charlesrymal-at-gmail.com'}}}}, {})

    return res

def test1():
    res = _test_lambda([{"command": "list"}], 'todo_database')

    print(res['body'])
    
    data = json.loads(res['body'])[0]
    
    print()
    print(data)
    print()

    task_list = data['tasks']

    for task_id, t in task_list.items():
        print(t['title'])

def test3():
    res = _test_lambda([{
			"command": "create",
			"title": "test",
			"due": None,
			"parent_id": None
        }])

    data = json.loads(res['body'])[0]
    print(data)


def test2(session):
    print('test2')

    res = session.task('test', None, None)

    print(res)


def test():
    test3()
    test1()
    
    session = tasks.session.Session('test', 'charlesrymal-at-gmail.com')

    test2(session)






