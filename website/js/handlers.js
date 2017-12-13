
var myApp = window.myApp || {};

function defaultAjaxError(jqXHR, textStatus, errorThrown) {
	console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
	console.error('Response: ', jqXHR.responseText);
	alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
}

function callAPI(data, onSuccess, onFailure) {
	console.log("callAPI");
	console.log(data);
	$.ajax({
		method: 'POST',
		url: _config.api.invokeUrl + '/tasks',
		headers: {
			Authorization: myApp.authToken
		},
		data: JSON.stringify(data),
		contentType: 'application/json',
		success: onSuccess,
		error: onFailure
	});
}
function moveTask(task_id, subtree1, subtree2)
{
	subtree2[task_id] = subtree1[task_id];
	delete subtree1[task_id];
}
function treeGetSubtree(tree, task_id)
{
	//console.log("treeGetSubtree");

	for(var task_id1 in tree)
	{
		if(tree.hasOwnProperty(task_id1))
		{
			var subtree = tree[task_id1]["tree"];

			//console.log(task_id1 + " == " + task_id);

			if(task_id1 == task_id) {
				console.log("return:");
				console.log(subtree);
				console.log(subtree == null);
				return subtree;
			}

			subtree = treeGetSubtree(subtree, task_id);

			if(subtree == null) {
				//console.log("recursive returned null");
			} else {
				//console.log("return from recursive:");
				//console.log(subtree);
				return subtree;
			}
		}
	}
	return null;
}

function getSubtreeOrRoot(task_id)
{
	if(task_id == "None") {
		return myApp.tasks;
	} else {
		return treeGetSubtree(myApp.tasks, task_id);
	}
}
function handleFormTaskEdit(event)
{
	console.log("handle task edit");

	event.preventDefault();

	task = myApp.taskCurrent;

	title = $("#divTaskDetail #title").val();
	due = $("#divTaskDetail #due").val();
	parent_id = $("#divTaskDetail #parent").val();
	var isContainer = $("#divTaskDetail #isContainer").prop("checked");

	commands = [];

	if(isContainer != task["isContainer"])
	{
		task["isContainer"] = isContainer;

		commands.push({
			"command": "update_is_container",
			"task_id": task["_id"],
			"isContainer": isContainer
		});
	}
	if(title != task["title"])
	{
		task["title"] = title;

		commands.push({
			"command": "update_title",
			"task_id": task["_id"],
			"title": title
		});
	}
	if(due != task["due_last"])
	{
		commands.push({
			"command": "update_due",
			"task_id": task["_id"],
			"due": due
		});
	}
	if(parent_id != task["parent"])
	{
		console.log("parent changed");
		console.log(task["parent"]);
		console.log(parent_id);

		var tree1 = getSubtreeOrRoot(task["parent"]);
		var tree2 = getSubtreeOrRoot(parent_id);

		console.log(tree1);
		console.log(tree2);

		task["parent"] = parent_id;

		moveTask(task["_id"], tree1, tree2);

		commands.push({
			"command": "update_parent",
			"task_id": task["_id"],
			"parent_id_str": parent_id
		});
	}

	if(commands.length > 0)
	{
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
	
	var task_id = myApp.taskCurrent["_id"];
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




