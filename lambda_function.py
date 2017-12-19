import datetime
import json
import traceback
import pytz
import todo

def taskList(session, body):
    tree = session.tree(session.task_view_default())
    return todo.safeDict(tree.tree)

def taskCreate(session, body):

    due = todo.stringToDatetime(body["due"])
    
    if body["parent_id"]:
        if body["parent_id"] == "None":
            parent_id = None
        else:
            parent_id = body["parent_id"]
    else:
        parent_id = None

    session.task(
            body["title"], 
            due,
            parent_id, )

    return taskList(session, None)

def taskUpdateDue(session, body):
    task_id = body["task_id"]
    due = todo.stringToDatetime(body["due"])
    session.updateDue(session.filter_id(task_id), due)
    return "update due success"

def taskUpdateStatus(session, body):
    task_id = body["task_id"]
    status = todo.Status[body["status"]]
    session.updateStatus(session.filter_id(task_id), status)
    return "success"

def taskDelete(session, body):
    task_id = body["task_id"]
    session.task_delete(task_id)
    return "success"

def taskUpdateTitle(session, body):
    task_id = body["task_id"]
    title = body["title"]
    session.updateTitle(session.filter_id(task_id), title)
    return "success"

def taskUpdateIsContainer(session, body):
    task_id = body["task_id"]
    session.updateIsContainer(session.filter_id(task_id), body["isContainer"])
    return "update isContainer success"

def taskUpdateParent(session, body):
    task_id = body["task_id"]
    parent_id_str = body["parent_id_str"]
    session.updateParent(session.filter_id(task_id), parent_id_str)
    return "success"

def taskPushPost(session, body):
    session.taskPushPost(body["task_id"], body["text"])
    return "push post success"

def errorResponse(responseBody):
    return {
        "statusCode": 400,
        "headers": {
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(responseBody),
        "isBase64Encoded": False}

functions = {
        "list": taskList,
        "create": taskCreate,
        "update_status": taskUpdateStatus,
        "update_title": taskUpdateTitle,
        "update_due": taskUpdateDue,
        "update_parent": taskUpdateParent,
        "update_is_container": taskUpdateIsContainer,
        "delete": taskDelete,
        "post": taskPushPost,
        }

def processBody(event, session, body):
    
    try:
        command = body["command"]
        f = functions[command]
        return f(session, body)
    except Exception as e:
        traceback.print_exc()
        return repr(e)

def lambda_handler(event, context):
    
    session = None
    responseBody = None

    try:
        body = json.loads(event["body"])
        username = event["requestContext"]["authorizer"]["claims"]['cognito:username']
        session = todo.Session(username)
        responseBody = json.dumps([processBody(event, session, b) for b in body])
        
        return {
            "statusCode": 200,
            "headers": {
                'Access-Control-Allow-Origin': '*',
            },
            "body": responseBody,
            "isBase64Encoded": False}

    except Exception as e:
        traceback.print_exc()
        return errorResponse(repr(e) + " event: " + str(event))
    
def test():
    s = todo.Session('charlesrymal-at-gmail.com')
    
    print(taskList(s, None))










