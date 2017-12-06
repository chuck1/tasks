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

def tasks_list(event):
    username = event["requestContext"]["authorizer"]["claims"]['cognito:username']

    s = todo.Session(username)

    tasks = list(process_tasks(s.iter_tree(s.filter_open())))
    
    responseBody = json.dumps(tasks)

    return responseBody

def lambda_handler(event, context):

    try:
        responseBody = tasks_list(event)
    except Exception as e:
        responseBody = repr(e) + " " + str(e)

    return {
        "statusCode": 200,
        "headers": {
            'Access-Control-Allow-Origin': '*',
        },
        "body": json.dumps(responseBody),
        "isBase64Encoded": False}

