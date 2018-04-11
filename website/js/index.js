/*global myApp _config AmazonCognitoIdentity AWSCognito*/

var myApp = window.myApp || {};

class ViewTasksList {
	constructor(root, tasks) {
		this.root = root;
		this.tasks = tasks;
	}
	load()
	{
		$("#divTasks").show();
		//$("#divTaskCreate").show();

		var div = $("#divTasks");
		
		div.empty();

		var div_lists = $("<div>");
		

		// clear select element
		$("#formCreateInputParent option").remove();

		//resetParentSelect($("#formCreateInputParent"), null);

		// create navigate up button
		if(this.root != null) {
			var button = $("<button>");
			button.text("up");
			button.click((ev) => {
				var p = treeGetBranch(myApp.tasks, this.root.task['parent']);
				console.log(p);

				if(p == null) {
					load_view_tasks_lists(null, myApp.tasks);
				} else {
					load_view_tasks_lists(p, p.children);
				}
			});
			div.append(button);
		}
		
		div.append(div_lists);

		// create lists
		this.create_lists(div_lists, this.tasks);
	}
	create_lists(container, tasks)
	{
		console.log('create lists');
		console.log(tasks);

		tasks_to_array(tasks).forEach(function(task) {
			create_list(container, task, 0);
		});

		this.create_list_form(container);
	}
	create_list_form(container)
	{
		var div = $("<div>");
		div.addClass('tasks_list');

		var input = $('<input type="text">');
		var button = $('<button>save</button>');

		var parent_id = null;
		if(this.root != null) {
			parent_id = this.root.task['_id'];
		}

		button.click((ev) => {
			taskCreate(input.val(), null, parent_id);
		});

		div.append(input);
		div.append(button);
		container.append(div);
	}
}

var view = null;

var authToken;

myApp.authToken.then(
	function setAuthToken(token) {
		if (token) {
			myApp.authToken = token;
		} else {
			window.location.href = '/signin.html';
		}
	}).catch(function handleTokenError(error) {
		alert(error);
		window.location.href = '/signin.html';
	});
function receive_view_tasks_lists(data) {
	var tasks = {};

	Object.values(data.tasks).forEach(function(task) {
		tasks[task["_id"]] = new Task(task);
	}, this);
	
	// store so we can later navigate to root
	myApp.tasks = tasks;

	load_view_tasks_lists(data.root, tasks);
}
function load_view_tasks_lists(root, tasks) {
	view = new ViewTasksList(root, tasks);
	view.load();
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

			receive_view_tasks_lists(result[0]);
		},
		function ajaxError(jqXHR, textStatus, errorThrown) {
			console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
			console.error('Response: ', jqXHR.responseText);
			alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
		});
}

function tasks_view_list(root_task_id) {
	callAPI(
		[{
			"command": "list",
			"root": root_task_id,
		}],
		function(result)
		{
			console.log('Response:');
			console.log(result);

			receive_view_tasks_lists(result[0]);
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
function create_list(container, task)
{
	console.log('create list');

	if(!task.should_display()) {
		console.log('should not display');
		return;	
	}

	var div = $("<div>");
	div.addClass('tasks_list');

	var div_title = $("<div>");
	div_title.addClass('title');
	div_title.text(task.task['title']);

	div_title.click(function(ev) {
		create_task_detail_modal(task);
	});

	div.append(div_title);

	container.append(div);


	tasks_to_array(task.children).forEach(function(child) {

		var child_div = $("<div>");
		child_div.addClass('tasks_list_item');
		
		child_div.text(child.task['title']);
		
		child_div.click((ev) => {
			create_task_detail_modal(child);
		});
		
		div.append(child_div);
	});


	return;

	var div_due = $("<div class=\"col due\">");
	var div_status = $("<div class=\"col status\">");
	div_due.html(format_date(task.due()) + "&nbsp;");
	div_status.html(task.task["status_last"]);
}
function format_date(date)
{
	if(date == null) return "";

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
function tasks_to_array(tasks) {
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

	return arr;
}
function taskDeleteCurrent() {
	taskDelete(myApp.taskCurrent);
}
function taskDelete(task, on_delete) {
	if(!confirm("Permanently delete task \"" + task.task["title"] + "\"?")) return;

	on_delete();

	task.is_deleted = true;
	view.load();

	callAPI(
		[{
			"command": "delete",
			"task_id": task.task["_id"]
		}],
		function(response) {
			console.log("response:", response);
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
function create_task_detail_modal(task) {

	var outer = $("<div>");
	outer.addClass("modal");
	outer.css('display', 'block');

	$(window).click(function(ev) {
		if (ev.target == outer.get(0)) {
			outer.css("display", "none");
		}
	});

	var div = $("<div>");
	div.addClass("task_detail");
	div.addClass("modal-content");
	
	// controls
	var div_controls = $("<div>");

	var button_list_view = $("<button>");
	button_list_view.text("go to lists view");
	button_list_view.click((ev) => {
		outer.css('display', 'none');
		load_view_tasks_lists(task, task.children);
	});
	
	div_controls.append(button_list_view);
	div.append(div_controls);

	// update form
	var form = $("<form>");
	
	var table = $("<table>");
	table.append("<tr><td>Title: <input type=\"text\" id=\"title\"></input></td></tr>");
	table.append("<tr><td>Due: <input type=\"text\" id=\"due\"></input></td></tr>");
	table.append("<tr><td>Parent: <select id=\"parent\"></select></td></tr>");
	table.append("<tr><td>Is container: <input type=\"checkbox\" id=\"isContainer\"></td></tr>");
	table.append("<tr><td><input type=\"submit\" value=\"Update\"></td></tr>");
	
	form.append(table);
	div.append(form);
	
	// status
	div.append("Status: <span id=\"status\"></span><br>");
	div.append("<button id=\"complete\">complete</button><br>");
	div.append("<button id=\"cancelled\">cancelled</button><br>");
	
	// delete	
	var button_delete = $("<button>delete</button>");

	button_delete.click(function() {
		taskDelete(task, () => {
			outer.css('display', 'none');
		});
	});

	div.append(button_delete);


	outer.append(div);
	$("body").append(outer);
	/*
	// update parent select tag 
	resetParentSelect($("#divTaskDetail #parent"), task.task["parent"]);

	loadPosts(task);

	$("#divTaskDetail #title").val(task.task["title"]);
	$("#divTaskDetail #due").val(task.task["due_last"]);
	$("#divTaskDetail #status").html(task.task["status"]);
	$("#divTaskDetail #isContainer").prop("checked", task.task["isContainer"]);
	*/

	/*
			<div id="divTaskEditTaskCreate" style="display:default">
				<h2>Create</h2>
		            	<form>
					<input type="text" id="inputTitle" placeholder="Title" required><br>
					<input type="text" id="inputDue" placeholder="Due date (UTC)"><br>
					<input type="submit" value="Create">
		        	</form>
			</div>

			<h2>Posts</h2>
			<div id="posts"></div>
			
			<div id="form_post">
				<form>
					<textarea id="text"></textarea>
					<input type="submit" value="Post">
				</form>
			</div>

		</div>
	*/
}
$(function onDocReady() {
	var root_task_id = null;
	tasks_view_list(root_task_id);

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

});



