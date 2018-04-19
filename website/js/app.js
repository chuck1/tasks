
class Application
{
	constructor() {
	}
	get_comments(task_id) {
		var texts = [];
		for(var i = 0; i < this.texts.length; i++) {
			var text = this.texts[i];

			if(text.d.task == task_id) {
				texts.push(text);
			}
		}
		return texts;
	}
	get_root_tasks() {
		var tasks = [];
		for(var i = 0; i < this.tasks.length; i++) {
			var p = this.tasks[i].task['parent'];
			if(p == null) {
				tasks.push(this.tasks[i]);
			}
		}
		return tasks;
	}
	get_task(task_id) {
		if(task_id == null) return null;
		for(var i = 0; i < this.tasks.length; i++) {
			if(this.tasks[i].task['_id'] == task_id) return this.tasks[i];
		}
		return null;
	}
	treeGetBranch(tree, task_id) {
		for(var task_id1 in tree)
		{
			if(tree.hasOwnProperty(task_id1))
			{
				var branch = tree[task_id1];

				if(task_id1 == task_id) return branch;

				branch = treeGetBranch(branch.children, task_id);

				if(branch) return branch;
			}
		}
		return null;
	}
	read_tasks(filter_string) {

		return new Promise((resolve, reject) => {

			var success = (result) =>
			{
				console.log('Response:');
				console.log(result);

				var tasks = [];
				var texts = [];
				var data = result[0];

				data.tasks.forEach(function(task) {
					tasks.push(new Task(task));
				});

				data.texts.forEach(function(d) {
					texts.push(new Text(d));
				});

				this.tasks = tasks;
				this.texts = texts;

				resolve();
			};

			callAPI(
					[{
						"command": "tasks list",
						"filter_string": filter_string,
					}],
					success,
					function ajaxError(jqXHR, textStatus, errorThrown) {
						console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
						console.error('Response: ', jqXHR.responseText);
						alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
					});
		});
	}
}

