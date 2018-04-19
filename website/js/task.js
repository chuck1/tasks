
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
		var children = this.get_children();
		
		var children_due = children.map(child => child.due());
		
		var children_due2 = children_due.map(function (d) {
			if(d == null) return null;
			return new Date(d);
		});
		
		var i = argmin(children_due);

		//if(task["due_last"] != "None") return task["due_last"];
		

		if(i == -1) {
			var d0 = this.task["due"];
			if(d0 == null) return d0;
			d1 = new Date(d0);
			console.log(d0);
			console.log(d1);
			return d1;
		}

		if(this.task["due"] == null) return children_due2[i];
		
		var d0 = new Date(this.task["due"]);
		
		if(d0 < children_due2[i]) {
			return d0;
		}
		
		return children_due[i];
	}

}

