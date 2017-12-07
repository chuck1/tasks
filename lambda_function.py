import datetime
import pytz
import json
import todo

def stringize_field(task, name):
    if task.get(name, None) is not None:
        task[name] = str(task[name])

def process_tasks(tasks):

    for task, level in tasks:
        task = dict(task)
        
        stringize_field(task, '_id')
        stringize_field(task, 'creator')
        stringize_field(task, 'parent')
        stringize_field(task, 'due')
        
        print(task)

        yield (task, level)

def tasks_list(session):
    
    tasks = list(process_tasks(session.iter_tree(session.filter_open())))
    
    responseBody = json.dumps(tasks)

    return responseBody

def task_create(session, body):

    if body["due"]:
        due_naive = datetime.datetime.strptime(body["due"], "%Y-%m-%d %H:%M")
        due = pytz.utc.localize(due_naive)
    else:
        due = None
    
    if body["parent_id"]:
        parent_id = body["parent_id"]
    else:
        parent_id = None

    session.task(
            body["title"], 
            due,
            parent_id, )

    return tasks_list(session)

def lambda_handler(event, context):
    
    session = None
    try:
        body = json.loads(event["body"])
        command = body["command"]
        username = event["requestContext"]["authorizer"]["claims"]['cognito:username']
        session = todo.Session(username)
    except Exception as e:
        responseBody = repr(e) + " " + str(e) + "event: " + str(event)
        return {
            "statusCode": 200,
            "headers": {
                'Access-Control-Allow-Origin': '*',
            },
            "body": json.dumps(responseBody),
            "isBase64Encoded": False}
    
    try:
        if command == "list":
            responseBody = tasks_list(session)
        elif command == "create":
            responseBody = task_create(session, body)
        else:
            raise RuntimeError("invalid command")
    except Exception as e:
        responseBody = repr(e) + " " + str(e)
    

    return {
        "statusCode": 200,
        "headers": {
            'Access-Control-Allow-Origin': '*',
        },
        "body": json.dumps(responseBody),
        "isBase64Encoded": False}



