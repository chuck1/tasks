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

	function taskCreate(title, due, parent_id) {
		$.ajax({
			method: 'POST',
			url: _config.api.invokeUrl + '/tasks',
			headers: {
				Authorization: authToken
			},
			data: JSON.stringify({
				"command": "create",
				"title": title,
				"due": due,
				"parent_id": parent_id
			}),
			contentType: 'application/json',
			success: function(result)
			{
				console.log('Response:');
				console.log(result);

				var tasks = JSON.parse(result);
				myApp.tasks = tasks;
				loadTaskList(tasks);
			},
			error: function ajaxError(jqXHR, textStatus, errorThrown) {
				console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
				console.error('Response: ', jqXHR.responseText);
				alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
			}
		});
	}

	function tasksList() {
		$.ajax({
			method: 'POST',
			url: _config.api.invokeUrl + '/tasks',
			headers: {
				Authorization: authToken
			},
			data: JSON.stringify({
				"command": "list"
			}),
			contentType: 'application/json',
			success: function(result)
			{
				console.log('Response:');
				console.log(result);

				var tasks = JSON.parse(result);
				myApp.tasks = tasks;
				loadTaskList(tasks);
			},
			error: function ajaxError(jqXHR, textStatus, errorThrown) {
				console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
				console.error('Response: ', jqXHR.responseText);
				alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
			}
		});
	}

	function loadTaskList(tasks)
	{
		console.log(tasks);

		$("#divTasks").show();
		$("#divTaskCreate").show();
		$("#divTaskDetail").hide();

		// clear list
		$("#divTasks div").remove();

		// clear select element
		$("#formCreateInputParent option").remove();

		var inputParent = $("#formCreateInputParent");

		inputParent.append($("<option value=\"\">None</option>"));

		tasks.forEach(function(element) {
			var task = element[0];
			var level = element[1];
			
			if(task["status"] != "NONE"){
				return;
			}

			var div = $("<div class=\"task_row\">");

			var div_due = $("<div class=\"task_due\">");
			if(task['due']){
				div_due.html(task['due']);
			}else{
				div_due.html('none');
			}

			var div_title = $("<div>");
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

		$.ajax({
			method: 'POST',
			url: _config.api.invokeUrl + '/tasks',
			headers: {
				Authorization: authToken
			},
			data: JSON.stringify({
				"command": "update_status",
				"task_id": task["_id"],
				"status": status_string
			}),
			contentType: 'application/json',
			success: function(result) {
				console.log('update status result:', result);
				
				$("#divTaskDetail status").html(status_string);
			},
			error: function ajaxError(jqXHR, textStatus, errorThrown) {
				console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
				console.error('Response: ', jqXHR.responseText);
				alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
			}
		});
	
	}
	function loadTaskDetail(task) {
		$("#divTasks").hide();
		$("#divTaskCreate").hide();
		
		$("#divTaskDetail").show();
		
		$("#divTaskDetail #back").click(function(){
			loadTaskList(myApp.tasks);
		});
	

		$("#divTaskDetail #title").html(task["title"]);
		$("#divTaskDetail #due").html(task["due"]);
		$("#divTaskDetail #parent").html(task["parent"]);
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

	$(function onDocReady() {
		tasksList();
		$('#formCreate').submit(handleFormCreate);
	});

}(jQuery));
