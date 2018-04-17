
class ViewTasksAgenda {
	constructor() {
		this.filter_string = '';
	}
	load() {
		$("div#view").empty();

		console.log('loading view tasks agenda');
		
		var div = $("<div>");
		
		// filter form

		var form = new ElephantFilterForm((filter) => {
			console.log(filter);
			this.filter_string = filter;
			this.refresh();
		});

		div.append(form.div);

		// list

		sort_task_array(this.tasks);

		this.tasks.forEach((task) => {
			if(task.should_display()) {
				div.append(this.create_task_div(task));
			}
		});

		$("div#view").append(div);
	}
	create_task_div(task) {

		var div = $("<div>");

		div.addClass('tasks_list_item');

		div.append(create_task_title_div(task));

		div.click((ev) => {
			create_task_detail_modal(task);
		});

		return div;
	}
	refresh() {
		get_tasks_list(this.filter_string).then((tasks) => {
			
			this.tasks = tasks;
			this.load();

		});
	}

}

