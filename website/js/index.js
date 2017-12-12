/*global myApp _config AmazonCognitoIdentity AWSCognito*/

var myApp = window.myApp || {};

(function indexScopeWrapper($) {

	var authToken;

	myApp.authToken.then(function setAuthToken(token) {
		if (token) {
			myApp.authToken = token;
		} else {
			window.location.href = '/signin.html';
		}
	}).catch(function handleTokenError(error) {
		alert(error);
		window.location.href = '/signin.html';
	});

	function taskCreate(title, due, parent_id) {
		callAPI(
			[{
				"command": "create",
				"title": title,
				"due": due,
				"parent_id": parent_id
			}],
			function(result)
			{
				console.log('Response:');
				console.log(result);

				/* clear form */
				$('#formCreateInputTitle').val("");
				$('#formCreateInputDue').val("");
				$('#formCreateInputParent').val("None");

				var tasks = result[0];
				myApp.tasks = tasks;
				loadTaskList(tasks);
			},
			function ajaxError(jqXHR, textStatus, errorThrown) {
				console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
				console.error('Response: ', jqXHR.responseText);
				alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
			});
	}

	function tasksList() {
		callAPI(
			[{
				"command": "list"
			}],
			function(result)
			{
				console.log('Response:');
				console.log(result);

				var tasks = result[0];
				myApp.tasks = tasks;
				loadTaskList(tasks);
			},
			function ajaxError(jqXHR, textStatus, errorThrown) {
				console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
				console.error('Response: ', jqXHR.responseText);
				alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
			});
	}

	function treeIter(tree, level, func)
	{
		for(var task_id in tree)
		{
			if(tree.hasOwnProperty(task_id))
			{
				var branch = tree[task_id];
				func(branch["task"], level);

				treeIter(branch["tree"], level + 1, func);
			}
		}
	}
	function treeGetBranch(tree, task_id)
	{
		for(var task_id1 in tree)
		{
			if(tree.hasOwnProperty(task_id1))
			{
				var branch = tree[task_id1];

				if(task_id1 == task_id) return branch;
				
				branch = treeGetBranch(branch["tree"], task_id);

				if(branch) return branch;
			}
		}
		return null;
	}

	function loadTaskList(tree)
	{
		console.log(tree);

		$("#divTasks").show();
		$("#divTaskCreate").show();
		$("#divTaskDetail").hide();

		// clear list
		$("#divTasks div").remove();

		// clear select element
		$("#formCreateInputParent option").remove();

		resetParentSelect($("#formCreateInputParent"), null);

		treeIter(tree, 0, function(task, level) {
			
			if(task["status_last"] != "NONE"){
				//return;
			}

			if(task["isContainer"]) {
				if(task["children"].length == 0) {
					return;
				}
			}

			var div = $("<div class=\"row task_row\">");

			var div_due = $("<div class=\"col-3 task_due\">");
			var div_status = $("<div class=\"col-3\">");

			if(task['due2']){
				div_due.html(task['due2']);
			}else{
				div_due.html('none');
			}
			
			//var div_status = $("<div class=\"\">");
			div_status.html(task["status_last"]);

			var div_title = $("<div class=\"col title\">");

			var span_title = $("<p></p>");
			span_title.css("padding-left", 40 * level);
			span_title.html(task['title']);
			span_title.click(function(){
				loadTaskDetail(task);
			});

			div_title.append(span_title);

			div.append(div_due);
			div.append(div_status);
			div.append(div_title);

			$('#divTasks').append(div);
		});
	}
	function defaultAjaxError(jqXHR, textStatus, errorThrown) {
		console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
		console.error('Response: ', jqXHR.responseText);
		alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
	}
	function taskDeleteCurrent() {
		taskDelete(myApp.taskCurrent);
	}
	function taskDelete(task) {
		if(!confirm("Permanently delete task?")) return;

		callAPI(
			[{
				"command": "delete",
				"task_id": task["_id"]
			}],
			function(response) {
				console.log("response:", response);
				tasksList();
			},
			defaultAjaxError);
	}
	function taskUpdateStatusCurrent(status_string) {
		taskUpdateStatus(myApp.taskCurrent, status_string);
	}
	function taskUpdateStatus(task, status_string) {
		//task["status"] = status_string;

		callAPI(
			[{
				"command": "update_status",
				"task_id": task["_id"],
				"status": status_string
			}],
			function(result) {
				console.log('update status result:', result);
				
				$("#divTaskDetail status").html(status_string);
			},
			function ajaxError(jqXHR, textStatus, errorThrown) {
				console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
				console.error('Response: ', jqXHR.responseText);
				alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
			});
	}
	function resetParentSelect(tag, selected_task_id)
	{
		tag.children().remove();
		
		tag.append($("<option value=\"None\">None</option>"));
		
		treeIter(myApp.tasks, 0, function(task, level) {
			var selected = "";
			if(task["_id"] == selected_task_id)
			{
				selected = "selected=\"selected\"";
			}
			
			var op = $("<option value=\""+ task["_id"] +"\" " + selected + ">");
			op.html('-'.repeat(level) + task["title"])

			tag.append(op);
		});
	}
	function loadTaskDetail(task) {

		myApp.taskCurrent = task;

		console.log("loadTaskEdit");
		console.log(task);

		$("#divTasks").hide();
		$("#divTaskCreate").hide();
		
		$("#divTaskDetail").show();
		
		$("#divTaskDetail #back").click(function(){
			loadTaskList(myApp.tasks);
		});
		
		/* update parent select tag */
		resetParentSelect($("#divTaskDetail #parent"), task["parent"]);
	
		$("#divTaskDetail #title").val(task["title"]);
		$("#divTaskDetail #due").val(task["due_last"]);
		$("#divTaskDetail #status").html(task["status"]);
		$("#divTaskDetail #isContainer").prop("checked", task["isContainer"]);
	}
	function handleFormCreate(event) {
		var title = $('#formCreateInputTitle').val();
		var due = $('#formCreateInputDue').val();
		var parent_id = $('#formCreateInputParent').val();

		console.log("handle create");
		console.log(title);
		console.log(due);
		console.log(parent);

		event.preventDefault();
		
		taskCreate(title, due, parent_id);
	}
	function handleFormTaskEditTaskCreate(event) {
		var title = $('#divTaskEditTaskCreate #inputTitle').val();
		var due   = $('#divTaskEditTaskCreate #inputDue').val();
		var parent_id = myApp.taskCurrent["_id"];

		console.log("handle create");
		console.log(title);
		console.log(due);
		console.log(parent_id);

		taskCreate(title, due, parent_id);
	}
	function handleFormTaskEdit_0(event)
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
	$(function onDocReady() {
		tasksList();
		$('#formCreate').submit(handleFormCreate);
		$('#formTaskEdit').submit(handleFormTaskEdit);
		$('#divTaskEditTaskCreate form').submit(function(event) {
			event.preventDefault();
			handleFormTaskEditTaskCreate(event)
		});
		$("#divTaskDetail #complete").click(function(){
			taskUpdateStatusCurrent("COMPLETE");
		});
		$("#divTaskDetail #delete").click(function(){
			taskDeleteCurrent();
		});

	});

}(jQuery));


