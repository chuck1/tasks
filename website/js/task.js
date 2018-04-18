
class Task {
	constructor(task) {
		this.task = task;
		
		var children = {};
		
		if('children' in this.task) {
			Object.values(this.task['children']).forEach(function(child) {
				children[child["_id"]] = new Task(child);
			});
		}
		
		this.children = children;

		this.is_deleted = false;
	}
	get_children()
	{
		var tasks = [];
		for(var i = 0; i < app.tasks.length; ++i) {
			if(app.tasks[i].task['parent'] == this.task['_id']) {
				tasks.push(app.tasks[i]);
			}
		}
		return tasks;
	}
	should_display()
	{	
		if(this.is_deleted) return false;

		var num_children_display = Object.values(this.children).filter(task => task.should_display()).length;

		if(num_children_display > 0) return true;
		
		if(this.task["status"] != 0) return false;
		
		if(this.task["isContainer"]) return false;

		return true;
	}
	due()
	{
		var children_due = this.get_children().map(child => child.due());
		
		var children_due2 = children_due.map(function (d) {
			if(d == null) return null;
			return new Date(d);
		});


		var i = argmin(children_due2);

		//if(task["due_last"] != "None") return task["due_last"];

		if(i == -1) return date_or_null(this.task["due_last"]);

		if(this.task["due_last"] == null) return children_due2[i];
		
		var d0 = new Date(this.task["due_last"]);

		if(d0 < children_due2[i]) {
			return d0;
		}
		
		return children_due[i];
	}

}

