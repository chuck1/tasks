/*global myApp _config AmazonCognitoIdentity AWSCognito*/

var myApp = window.myApp || {};

(function indexScopeWrapper($) {

	var authToken;

	myApp.authToken.then(function setAuthToken(token) {
		if (token) {
			authToken = token;
		} else {
			window.location.href = '/signin.html';
		}
	}).catch(function handleTokenError(error) {
		alert(error);
		window.location.href = '/signin.html';
	});

	function callAPI(data, onSuccess, onFailure) {
		$.ajax({
			method: 'POST',
			url: _config.api.invokeUrl + '/tasks',
			headers: {
				Authorization: authToken
			},
			data: JSON.stringify(data),
			contentType: 'application/json',
			success: onSuccess,
			error: onFailure
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

		var inputParent = $("#formCreateInputParent");

		inputParent.append($("<option value=\"\">None</option>"));

		treeIter(tree, 0, function(task, level) {
			
			if(task["status"] != "NONE"){
				return;
			}

			var div = $("<div class=\"row task_row\">");

			var div_due = $("<div class=\"col-sm task_due\">");

			if(task['due']){
				div_due.html(task['due']);
			}else{
				div_due.html('none');
			}

			var div_title = $("<div class=\"col-md\">");
			div_title.html(task['title']);
			div_title.css("padding-left", 20 * level);
			div_title.click(function(){
				loadTaskDetail(task);
			});

			div.append(div_due);
			div.append(div_title);

			$('#divTasks').append(div);

			// add option
			inputParent.append($("<option value=\""+ task["_id"] +"\">"+task["title"]+"</option>"));
		});
	}
	function taskUpdateStatus(task, status_string) {
		task["status"] = status_string;

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
	function loadTaskDetail(task) {

		console.log("loadTaskEdit");
		console.log(myApp);

		myApp.taskCurrent = task;

		$("#divTasks").hide();
		$("#divTaskCreate").hide();
		
		$("#divTaskDetail").show();
		
		$("#divTaskDetail #back").click(function(){
			loadTaskList(myApp.tasks);
		});
		
		/* update parent select tag */
		$("#divTaskDetail #parent option").remove();
		var inputParent = $("#divTaskDetail #parent");
		inputParent.append($("<option value=\"None\">None</option>"));
		
		treeIter(myApp.tasks, 0, function(task1, level) {

			var selected = "";
			if(task["parent"] == task1["_id"]){
				selected = "selected=\"selected\"";
			}

			var s = "<option value=\""+ task1["_id"] +"\" " + selected + ">" + task1["title"] + "</option>";
			console.log("append: " + s);
			inputParent.append($(s));
		});

	
		$("#divTaskDetail #title").val(task["title"]);
		$("#divTaskDetail #due").html(task["due"]);
		/*$("#divTaskDetail #parent").html(task["parent"]);*/
		$("#divTaskDetail #status").html(task["status"]);

		$("#divTaskDetail #complete").click(function(){
			taskUpdateStatus(task, "COMPLETE");
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

	function handleFormTaskEdit(event) {
		event.preventDefault();

		task = myApp.taskCurrent;
		
		title = $("#divTaskDetail #title").val();
		parent_id = $("#divTaskDetail #parent").val();
		
		commands = [];

		if(title != task["title"])
		{
			task["title"] = title;
			
			commands.push({
				"command": "update_title",
				"task_id": task["_id"],
				"title": title
			});
		}

		if(parent_id != task["parent"])
		{
			console.log("parent changed");
			console.log(task["parent"]);
			console.log(parent_id);
			
			console.log(treeGetBranch(myApp.tasks, task["parent"]));
			console.log(treeGetBranch(myApp.tasks, parent_id));

			task["parent"] = parent_id;
			
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
	});

}(jQuery));
