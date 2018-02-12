
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
	}
	should_display()
	{	
		var num_children_display = Object.values(this.children).filter(task => task.should_display()).length;

		if(num_children_display > 0) return true;
		
		if(this.task["status_last"] != "NONE") return false;
		
		if(this.task["isContainer"]) return false;

		return true;
	}
	due(depth=0)
	{
		//console.log(child_branches);

		var children_due = Object.values(this.children).map(child => child.due(depth + 1));
		
		var children_due2 = children_due.map(function (d) {
			if(d == null) return null;
			return new Date(d);
		});


		var i = argmin(children_due2);

		//if(task["due_last"] != "None") return task["due_last"];

		if(i == -1) return date_or_null(this.task["due_last"]);

		if(this.task["due_last"] == null) return children_due2[i];
		
		var d0 = new Date(this.task["due_last"]);

		/*
		if(depth == 0)
		{		
			console.log(this);
			console.log(this.task["due_last"]);
			console.log(d0);
			console.log(Date(this.task["due_last"]));
			console.log(children_due2);
			console.log(d0 < children_due2[i]);
		}*/
		

		if(d0 < children_due2[i]) {
			return d0;
		}
		
		return children_due[i];
	}

}

