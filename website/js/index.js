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
	function process_received_tasks(tasks)
	{
		myApp.tasks = {};

		Object.values(tasks).forEach(function(task) {
			myApp.tasks[task["_id"]] = new Task(task);
		});
	}
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
				process_received_tasks(tasks);
				loadTaskList(myApp.tasks);
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
				process_received_tasks(tasks);
				loadTaskList(myApp.tasks);
			},
			function ajaxError(jqXHR, textStatus, errorThrown) {
				console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
				console.error('Response: ', jqXHR.responseText);
				alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
			});
	}

	function treeIter(tree, level, func)
	{
		Object.values(tree).forEach(function(task) {
			//var branch = tree[task_id];
			
			func(task, level);
			
			treeIter(task.children, level + 1, func);
		});
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
	function add_task_to_list(container, task, level)
	{
		if(!task.should_display()) return;

		var row = $("<div class=\"row\">");

		var div = $("<div class=\"detail\">");

		var div_due = $("<div class=\"col due\">");
		var div_status = $("<div class=\"col status\">");
		var div_title =  $("<div class=\"col title\">");
		var div_edit_button = $("<div class=\"col edit\">");
		

		div_due.html(format_date(task.due()) + " ");

		//var div_status = $("<div class=\"\">");
		div_status.html(task.task["status_last"]);

		var p_title = $("<p></p>");
		p_title.css("padding-left", 40 * level);

		p_title.html(markdown.toHTML(task.task['title']));

		div_edit_button.html("edit");
		div_edit_button.click(function(){
			loadTaskDetail(task);
		});

		div_title.append(p_title);
		

		div.append(div_due);
		div.append(div_status);
		div.append(div_edit_button);
		div.append(div_title);

		var div_list = $("<div class=\"list\">");

		add_tasks_to_list(div_list, task.children, level + 1);

		row.append(div);
		row.append(div_list);

		container.append(row);
	}
	function format_date(date)
	{
		if(date == null) return null;

		var d = date.getDate();
		var mo = date.getMonth() + 1;

		var h = date.getHours();
		var m = date.getMinutes();

		var ret = "";
		ret += date.getFullYear() + "-";

		if(mo < 10) ret += "0";
		ret += mo + "-";

		if(d < 10) ret += "0";
		ret += d + " ";

		if(h < 10) ret += "0";
		ret += h + ":";

		if(m < 10) {
			ret += "0";
		}
		ret += m;

		return ret;
	}
	function add_tasks_to_list(container, tasks, level)
	{
		var arr = Object.values(tasks);

		arr.sort(function(a, b) {
			d1 = a.due();
			d2 = b.due();
			if(d1 == null) return 1;
			if(d2 == null) return -1;
			if(d1 < d2) return -1;
			if(d1 > d2) return 1;
			return 0;
		});

		arr.forEach(function(task) {
			add_task_to_list(container, task, level);

			//add_tasks_to_list(container, task.children, level + 1);
		});
	}
	function loadTaskList(tree)
	{
		$("#divTasks").show();
		$("#divTaskCreate").show();
		$("#divTaskDetail").hide();

		// clear list
		$("#divTasks div").remove();

		// clear select element
		$("#formCreateInputParent option").remove();

		resetParentSelect($("#formCreateInputParent"), null);

		add_tasks_to_list($("#divTasks"), tree, 0);
	}
	function taskDeleteCurrent() {
		taskDelete(myApp.taskCurrent);
	}
	function taskDelete(task) {
		if(!confirm("Permanently delete task?")) return;

		callAPI(
			[{
				"command": "delete",
				"task_id": task.task["_id"]
			}],
			function(response) {
				console.log("response:", response);
				tasksList();
			},
			defaultAjaxError);
	}
	function taskUpdateStatusCurrent(status_string)
	{
		taskUpdateStatus(myApp.taskCurrent, status_string);
	}
	function taskUpdateStatus(task, status_string)
	{
		callAPI(
			[{
				"command": "update_status",
				"task_id": task.task["_id"],
				"status": status_string
			}],
			function(result) {
				console.log('update status result:', result);

				// if success

				$("#divTaskDetail #status").html(status_string);

				task.task["status_last"] = status_string;
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

			if(task.task["_id"] == selected_task_id)
			{
				selected = "selected=\"selected\"";
			}

			var op = $("<option value=\""+ task.task["_id"] +"\" " + selected + ">");
			op.html('-'.repeat(level) + task.task["title"])

			tag.append(op);
		});
	}
	function loadPosts(task) {
		var div = $("div#posts");
		div.children().remove();

		task.task["posts"].forEach(function(post) {
			var div_post = $("<div>");
			div_post.html(post["user_username"] + "(" + post["datetime"] + "):" + post["text"]);
			div.append(div_post);
		});
	}
	function loadTaskDetail(task)
	{
		myApp.taskCurrent = task;

		$("#divTasks").hide();
		$("#divTaskCreate").hide();

		$("#divTaskDetail").show();

		$("#divTaskDetail #back").click(function(){
			loadTaskList(myApp.tasks);
		});

		/* update parent select tag */
		resetParentSelect($("#divTaskDetail #parent"), task.task["parent"]);

		loadPosts(task);

		$("#divTaskDetail #title").val(task.task["title"]);
		$("#divTaskDetail #due").val(task.task["due_last"]);
		$("#divTaskDetail #status").html(task.task["status"]);
		$("#divTaskDetail #isContainer").prop("checked", task.task["isContainer"]);
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
		var parent_id = myApp.taskCurrent.task["_id"];

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

		if(isContainer != task.task["isContainer"])
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
			commands.push({
				"command": "update_due",
				"task_id": task.task["_id"],
				"due": due
			});
		}
		if(parent_id != task.task["parent"])
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

		$("#form_post form").submit(handleFormPost);

		$('#divTaskEditTaskCreate form').submit(function(event) {
			event.preventDefault();
			handleFormTaskEditTaskCreate(event)
		});
		$("#divTaskDetail #complete").click(function(){
			taskUpdateStatusCurrent("COMPLETE");
		});
		$("#divTaskDetail #cancelled").click(function(){
			taskUpdateStatusCurrent("CANCELLED");
		});
		$("#divTaskDetail #delete").click(function(){
			taskDeleteCurrent();
		});

	});

}(jQuery));


