
var myApp = window.myApp || {};

function defaultAjaxError(jqXHR, textStatus, errorThrown) {
	console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
	console.error('Response: ', jqXHR.responseText);
	alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
}
function call_api(commands, callbacks) {
	var db_name_tasks = getParameterByName('database_tasks');
	var db_name_texts = getParameterByName('database_texts');

	var data = {
		commands: commands,
		database_tasks: db_name_tasks,
		database_texts: db_name_texts,
	};
	
	console.log('send', data);

	$.ajax({
		method: 'POST',
		url: _config.api.invokeUrl + '/tasks',
		headers: {
			Authorization: myApp.authToken
		},
		data: JSON.stringify(data),
		contentType: 'application/json',
		success: (result) => {
			for(var i = 0; i < commands.length; ++i) {
				console.log(result[i]);
				callbacks[i](result[i]);
			}
		},
		error: (jqXHR, textStatus, errorThrown) => {
			console.error(jqXHR);
			console.error(textStatus);
			console.error(errorThrown);
		}
	});
}
function callAPI(data, onSuccess, onFailure) {
	db_name_tasks = getParameterByName('database_tasks');
	db_name_texts = getParameterByName('database_texts');

	data1 = {
		commands: data,
		database_tasks: db_name_tasks,
		database_texts: db_name_texts,
	}

	url = _config.api.invokeUrl + '/tasks';

	console.log("callAPI");
	console.log(data1);
	console.log('send to', url);

	$.ajax({
		method: 'POST',
		url: _config.api.invokeUrl + '/tasks',
		headers: {
			Authorization: myApp.authToken
		},
		data: JSON.stringify(data1),
		contentType: 'application/json',
		success: onSuccess,
		error: onFailure
	});
}
function moveTask(task_id, subtree1, subtree2)
{
	console.log('move task');
	console.log(subtree1)
	console.log(subtree2)

	subtree2[task_id] = subtree1[task_id];
	delete subtree1[task_id];
}
function treeGetSubtree(tree, task_id)
{
	console.log("tree get subtree");
	console.log(tree);
	console.log(Object.keys(tree));

	for(var task_id1 of Object.keys(tree))
	{
		console.log(task_id1);

		var task = tree[task_id1];

		console.log(task);

		var subtree = task.children;

		//console.log(task_id1 + " == " + task_id);

		if(task_id1 == task_id) {
			console.log("return:");
			console.log(subtree);
			console.log(subtree == null);
			return subtree;
		}

		subtree = treeGetSubtree(subtree, task_id);

		if(subtree != null) return subtree;
	}
	return null;
}

function getSubtreeOrRoot(task_id)
{
	if(task_id == "None") {
		return myApp.tasks;
	} else if(task_id == null) {
		return myApp.tasks;
	} else {
		return treeGetSubtree(myApp.tasks, task_id);
	}
}
function handleFormTaskEdit(event, task, input_title, input_due)
{
	console.log("handle task edit");

	event.preventDefault();

	title = input_title.val();
	
	due = input_due.val();

	if(due == "") due = null;

	//parent_id = $("#divTaskDetail #parent").val();
	//var isContainer = $("#divTaskDetail #isContainer").prop("checked");

	commands = [];

	if(false) //if(isContainer != task.task["isContainer"])
	{
		task.task["isContainer"] = isContainer;

		commands.push({
			"command": "update_is_container",
			"task_id": task.task["_id"],
			"isContainer": isContainer
		});
	}

	if(title != task.task["title"])
	{
		task.task["title"] = title;

		commands.push({
			"command": "update_title",
			"task_id": task.task["_id"],
			"title": title
		});
	}
	if(due != task.task["due_last"])
	{
		console.log('due changed');
		console.log(task.task["due_last"]);
		console.log(due);
		
		task.task["due_last"] = due;

		commands.push({
			"command": "update_due",
			"task_id": task.task["_id"],
			"due": due
		});
	}
	if(false) //if(parent_id != task.task["parent"])
	{
		console.log("parent changed");
		console.log(task.task["parent"]);
		console.log(parent_id);

		var tree1 = getSubtreeOrRoot(task.task["parent"]);
		var tree2 = getSubtreeOrRoot(parent_id);

		console.log(tree1);
		console.log(tree2);

		task.task["parent"] = parent_id;

		moveTask(task.task["_id"], tree1, tree2);

		commands.push({
			"command": "update_parent",
			"task_id": task.task["_id"],
			"parent_id_str": parent_id
		});
	}
	
	

	if(commands.length > 0)
	{
		view.load();

		callAPI(
			commands,
			function(result){
				console.log("task edit success");
				console.log(result);
			},
			function(jqXHR, textStatus, errorThrown) {
				console.error('Error: ', textStatus, ', Details: ', errorThrown);
				console.error('Commands:');
				console.log(commands);
				console.error('Response: ', jqXHR.responseText);
				alert('An error occured:\n' + jqXHR.responseText);
			});
	}

}
function handleFormPost()
{
	console.log("handle form post");
	event.preventDefault();

	var task_id = myApp.taskCurrent.task["_id"];
	var text = $("#form_post textarea#text").val();

	console.log(task_id);
	console.log(text);

	callAPI(
		[{
			"command": "post",
			"task_id": task_id,
			"text": text
		}],
		function(response) {
			console.log("response:", response);
		},
		defaultAjaxError);
}




