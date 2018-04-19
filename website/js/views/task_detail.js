
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

		view = new ViewTasksLists(task.task['_id']);
		view.load();
	});
	
	div_controls.append(button_list_view);
	div.append(div_controls);
	// update form
	
	var append_row = (table, el) => {
		var td = $("<td>");
		var tr = $("<tr>");
		td.append(el);
		tr.append(td)
		table.append(tr);
	};

	var table = $("<table>");
	
	// title
	
	var div_title = $("<div>Title: </div>");
	var input_title = $("<input type=\"text\"></input>");
	input_title.val(task.task['title']);
	div_title.append(input_title);

	append_row(table, div_title);

	// due

	var div_due = $("<div>Due: </div>");
	var input_due = $("<input type=\"text\"></input>");
	input_due.val(task.task['due']);
	div_due.append(input_due);

	append_row(table, div_due);
	
	// the rest

	table.append("<tr><td>Parent: " + task.task["parent"] + "</td></tr>");
	table.append("<tr><td>Is container: <input type=\"checkbox\" id=\"isContainer\"></td></tr>");
	// save button
	
	var button_save = $("<button>Update</button>");

	button_save.click((ev) => {
		handleFormTaskEdit(ev, task, input_title, input_due);
	});

	append_row(table, button_save);

	div.append(table);
	
	// status
	div.append("Status: <span id=\"status\"></span><br>");
	
	// complete
	var button_complete = $("<button id=\"complete\">complete</button>");
	
	button_complete.click(function() {
		taskUpdateStatus(task, "COMPLETE");
		outer.css('display', 'none');
	});

	div.append(button_complete);
	div.append('<br>');

	//div.append("<button id=\"cancelled\">cancelled</button><br>");
	
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
	// comments
	
	var texts = app.get_comments(task.task._id);

	div.append(create_div_comments(task, texts));

	/*
	// update parent select tag 

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
