
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
}

