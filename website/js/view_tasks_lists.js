
class ViewTasksList {
	constructor(root_id) {
		this.root_id = root_id;
	}
	refresh() {
		get_tasks_list(this.filter_string).then((tasks) => {
			this.tasks = tasks;
			this.load();
		});
	}
	get_root() {
		
	}
	create_root_info()
	{
		console.log('root info');
		console.log(this.root);

		var div = $("<div>");

		// title
		
		var title = $("<h1>");

		if(this.root != null) {
			title.text(this.root.task['title']);
		} else {
			title.text('root');
		}

		div.append(title);

		// navigate up button
			
		if(this.root != null) {
			var root_parent = this.root.task['parent'];
			console.log('root parent id', root_parent);
			var p = treeGetBranch(myApp.tasks, root_parent);
			console.log('root parent', p);

			var button = $("<button>");
			button.text("up");
			button.click((ev) => {
				console.log(p);

				if(p == null) {
					load_view_tasks_lists(null, myApp.tasks);
				} else {
					load_view_tasks_lists(p, p.children);
				}
			});
			div.append(button);
		}

		// droppable
		
		div.append(create_droppable(this.root));

		return div;
	}
	load()
	{
		$("#divTasks").show();

		var div = $("#divTasks");
		
		div.empty();

		var div_lists = $("<div>");

		// clear select element
		$("#formCreateInputParent option").remove();

		var div_root = this.create_root_info();
		if(div_root != null) {
			div.append(div_root);
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

function create_droppable(task)
{
	// task - the task to become the new parent

	var div_drop = $("<div>");
	div_drop.addClass('tasks_list_item');
	div_drop.addClass('drop');
	div_drop.data('task', task);
	
	var parent_id = null;
	if(task != null) {
		parent_id = task.task['_id'];
	}

	div_drop.droppable({
		classes: {},
		drop: (ev, ui) => {
			var task_dragged = ui.draggable.data('task')

			if(task != null) {
				console.log('dragged "' + task_dragged.task['title'] + '" into "' + task.task['title'] + '"');
			} else {
				console.log('dragged "' + task_dragged.task['title'] + '" into root');
			}

			if(task_dragged.task['parent'] == parent_id) {
				console.log('dropped into own parent, do nothing');
				return;
			}

			move_task(task_dragged, parent_id);
		}
	});
	
	return div_drop;
}
function create_task_title_div(task) {
	
	var div = $("<div>");

	var div_title = $("<div>");
	div_title.text(task.task['title']);
	
	div.append(div_title);

	var div_indicators = $("<div>");
	div_indicators.addClass("indicators");

	// due datetime
	
	var due = task.due();
	if(due != null) {
		var div_due = datetime_div(due);
		div_due.addClass("indicator");
		div_indicators.append(div_due);
	}
	
	// id
	
	var div_id = $("<div>");
	div_id.text('#' + task.task['_id'].substring(20,24));
	div_id.addClass("indicator");
	div_indicators.append(div_id);

	div.append(div_indicators);

	return div;
}
function create_list_item(child)
{
	if(!child.should_display()) {
		return;	
	}

	var child_div = $("<div>");
	child_div.addClass('tasks_list_item');

	child_div.append(create_task_title_div(child));

	child_div.click((ev) => {
		create_task_detail_modal(child);
	});


	// draggable
	child_div.draggable({
		revert: (dropped) => {
			app.dragging = null;

			if(dropped == false) return true;

			if(!dropped.hasClass('tasks_list_item')) return true;
			if(!dropped.hasClass('drop')) return true;

			var task_dropped = dropped.data('task');

			if(task_dropped == null) {
				return true;
			}

			if(dropped.data('task').task['_id'] == child.task['parent']) {
				console.log('dropped into own parent, revert');
				return true;
			}

			return false;
		},
		start: () => {
			app.dragging = child_div;
		},
	});

	// data
	child_div.data('task', child);

	return child_div;
}
function create_list(container, task)
{
	//console.log('create list');

	if(!task.should_display()) {
		//console.log('should not display');
		return;	
	}

	var div = $("<div>");
	div.addClass('tasks_list');
	div.data('task', task);	

	// draggable
	div.draggable({
		revert: (dropped) => {
			app.dragging = null;

			if(dropped == false) return true;

			if(!dropped.hasClass('tasks_list_item')) return true;
			if(!dropped.hasClass('drop')) return true;

			var task_dropped = dropped.data('task');

			if(task_dropped == null) {
				return true;
			}

			if(dropped.data('task').task['_id'] == task.task['parent']) {
				console.log('dropped into own parent, revert');
				return true;
			}


			return false;
		},
		start: () => {
			app.dragging = div;

		},
	});

	var div_title = $("<div>");
	div_title.addClass('title');
	div_title.text(task.task['title']);

	div_title.click(function(ev) {
		create_task_detail_modal(task);
	});

	div.append(div_title);

	// due datetime
	var due = task.due();
	if(due != null) {
		div.append(datetime_div(due));
	}

	container.append(div);

	tasks_to_array(task.children).forEach(function(child) {
		var child_div = create_list_item(child);
		
		div.append(child_div);
	});

	// create task form

	var div_child_form = $("<div>");
	div_child_form.addClass('tasks_list_item');

	var input = $('<input type="text">');
	var button = $('<button>save</button>');

	button.click((ev) => {
		taskCreate(input.val(), null, task.task['_id']);
	});

	div_child_form.append(input);
	div_child_form.append(button);
	div.append(div_child_form);

	// droppable

	var div_child_drop = $("<div>");
	div_child_drop.addClass('tasks_list_item');
	div_child_drop.addClass('drop');
	div_child_drop.data('task', task);
	div_child_drop.droppable({
		classes: {},
		drop: (ev, ui) => {
			var task_dragged = ui.draggable.data('task')
			console.log('dragged "' + task_dragged.task['title'] + '" into "' + task.task['title'] + '"');

			if(task_dragged.task['parent'] == task.task['_id']) {
				console.log('dropped into own parent, do nothing');
				return;
			}

			move_task(task_dragged, task.task['_id']);
		}
	});
	
	/* not working, these events arent fired while dragging
	 
	div_child_drop.hide();
	
	div.mouseenter((ev) => {
		div_child_drop.show();
	}).mouseleave((ev) => {
		div_child_drop.hide();
	});
	*/

	div.data('drop', div_child_drop);
	div.append(div_child_drop);
	div_child_drop.hide();

	/*
	var div_status = $("<div class=\"col status\">");
	div_status.html(task.task["status_last"]);
	*/
}

