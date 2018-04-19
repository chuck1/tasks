
class ViewTask {
	constructor(container, task, outer) {
		this.container = container;
		this.task = task;
		this.outer = outer;
	}
	load() {
		var _this = this;

		this.container.empty();

		// controls
		var div_controls = $("<div>");

		var button_list_view = $("<button>");
		button_list_view.text("go to lists view");
		button_list_view.click((ev) => {
			_this.outer.css('display', 'none');

			view = new ViewTasksLists(_this.task.task['_id']);
			view.load();
		});

		div_controls.append(button_list_view);
		this.container.append(div_controls);
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
		input_title.val(this.task.task['title']);
		div_title.append(input_title);

		append_row(table, div_title);

		// due

		var div_due = $("<div>Due: </div>");
		var input_due = $("<input type=\"text\"></input>");
		input_due.val(this.task.task['due']);
		div_due.append(input_due);

		append_row(table, div_due);

		// the rest

		table.append("<tr><td>Parent: " + this.task.task["parent"] + "</td></tr>");
		table.append("<tr><td>Is container: <input type=\"checkbox\" id=\"isContainer\"></td></tr>");
		// save button

		var button_save = $("<button>Update</button>");

		button_save.click((ev) => {
			handleFormTaskEdit(ev, this.task, input_title, input_due);
		});

		append_row(table, button_save);

		this.container.append(table);

		// status
		this.container.append("Status: <span id=\"status\"></span><br>");

		// complete
		var button_complete = $("<button id=\"complete\">complete</button>");

		button_complete.click(function() {
			taskUpdateStatus(this.task, "COMPLETE");
			_this.outer.css('display', 'none');
		});

		this.container.append(button_complete);
		this.container.append('<br>');

		//div.append("<button id=\"cancelled\">cancelled</button><br>");

		// delete	
		var button_delete = $("<button>delete</button>");

		button_delete.click(function() {
			taskDelete(_this.task, () => {
				_this.outer.css('display', 'none');
			});
		});

		this.container.append(button_delete);



		// comments

		var texts = app.get_comments(this.task.task._id);
		
		this.container.append(create_div_comments(this.task, texts, () => {
			this.load();
		}));

		//$("#divTaskDetail #isContainer").prop("checked", task.task["isContainer"]);
	}
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

	outer.append(div);
	$("body").append(outer);

	var view = new ViewTask(div, task, outer);
	view.load();
}

