
var app = new Application();
var view = null;

var authToken;

myApp.authToken.then(
	function setAuthToken(token) {
		if (token) {
			myApp.authToken = token;
		} else {
			window.location.href = '/signin.html';
		}
	}).catch(function handleTokenError(error) {
		alert(error);
		window.location.href = '/signin.html';
	});

function getParameterByName(name, url)
{
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function process_tasks(data) {
	var tasks = {};

	Object.values(data.tasks).forEach(function(task) {
		tasks[task["_id"]] = new Task(task);
	}, this);
	
	// store so we can later navigate to root
	myApp.tasks = tasks;

	return tasks;
}
function tasks_create(title, due, parent_id) {
	console.log('create task');

	if(parent_id == "") {
		parent_id = null;
	}

	// TODO send this object to api
	var task = {
		"title": title,
		"due": due,
		"parent": parent_id,
		"status": 0,
	};
	
	var success = (data) => {
		task['_id'] = data.inserted_id;

		var task1 = new Task(task);

		app.tasks.push(task1);

		view.load();
	};

	callAPI(
		[{
			"command": "tasks create",
			"task": task,
		}],
		function(result)
		{
			console.log('Response:');
			console.log(result);

			var data = result[0];
			
			success(data);
		},
		function ajaxError(jqXHR, textStatus, errorThrown) {
			console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
			console.error('Response: ', jqXHR.responseText);
			alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
		});
}


function treeIter(tree, level, func)
{
	Object.values(tree).forEach(function(task) {
		//var branch = tree[task_id];
		
		func(task, level);
		
		treeIter(task.children, level + 1, func);
	});
}
function datetime_easy_read(datetime, now) {

	d = datetime - now;

	weekdays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thur', 'Fri', 'Sat'];
	months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	weekday = weekdays[datetime.getDay()];
	month = months[datetime.getMonth()];

	var ms_per_day = 1000 * 60 * 60 * 24;

	var time_string = `${datetime.getHours().toString().padStart(2,'0')}:${datetime.getMinutes().toString().padStart(2,'0')}`;

	datetime_to_date = (a) => {
		return new Date(a.getFullYear(), a.getMonth(), a.getDate());
	};
	
	var date = datetime_to_date(datetime);
	var tomorrow_date = datetime_to_date(new Date(now.valueOf() + ms_per_day));
	var now_date = datetime_to_date(now);

	if(d > 0) {
		if(date.valueOf() == now_date.valueOf()) {
			return time_string;
		}
		
		if(date.valueOf() == tomorrow_date.valueOf())
		{
			return `Tomorrow ${time_string}`;
		}

		if(d < ms_per_day * 7) {
			return `${weekday} ${time_string}`;
		}
	}

	return `${weekday} ${month} ${datetime.getDate()}`
}
function datetime_div(date) {
	var div = $("<div>");
	
	var now = new Date();

	div.text(datetime_easy_read(date, now));

	div.addClass('datetime');

	d = date - now;
	
	// less than one day - red
	// less than three days - yellow
	// otherwise - no color
	
	var day = 1000 * 60 * 60 * 24;

	if(d < day) {
		div.addClass('red');
	} else if(d < day * 3) {
		div.addClass('yellow');
	} else {
	}

	return div;
}
function move_task(task, new_parent_id) {
	console.log('move task');

	if(task.task['_id'] == new_parent_id) {
		console.log('cannot be own parent!');
		return;
	}

	task.task["parent"] = new_parent_id;

	//moveTask(task.task["_id"], tree1, tree2);
	
	view.load();

	callAPI(
		[{
			"command": "update_parent",
			"task_id": task.task["_id"],
			"parent_id_str": new_parent_id
		}],
		function(response) {
			console.log("response:", response);
		},
		defaultAjaxError);
}
function format_date(date)
{
	if(date == null) return "";

	var d = date.getDate();
	var mo = date.getMonth() + 1;

	var h = date.getHours();
	var m = date.getMinutes();

	var ret = "";
	ret += date.getFullYear() + "-";

	if(mo < 10) ret += "0";
	ret += mo + "-";

	if(d < 10) ret += "0";
	ret += d + " ";

	if(h < 10) ret += "0";
	ret += h + ":";

	if(m < 10) {
		ret += "0";
	}
	ret += m;

	return ret;
}
function compare(a, b) {
	var c = 0;
	if(a < b) { c = -1; }
	if(b < a) { c = 1; }
	//console.log('compare', typeof a, typeof b);
	//console.log(a, b, a - b, c);
	return c;
}
function sort_task_array(arr) {

	console.log('sort');

	arr.sort(function(a, b) {
		d1 = a.due();
		d2 = b.due();

		if((d1 != null) || (d2 != null)) {
			if(d1 == null) return 1;
			if(d2 == null) return -1;

			var c = compare(d1.valueOf(), d2.valueOf());
			//console.log('sort by date', d1, d2, c);
			if(c != 0) {
				return c;
			}
		}

		c = compare(a.task['title'], b.task['title']);
		if(c != 0) return c;

		return compare(a.task['_id'], b.task['_id']);
	});
}
function tasks_to_array(tasks) {
	var arr = Object.values(tasks);

	arr.sort(function(a, b) {
		d1 = a.due();
		d2 = b.due();

		if((d1 != null) || (d2 != null)) {
			if(d1 == null) return 1;
			if(d2 == null) return -1;

			var c = compare(d1.valueOf(), d2.valueOf());
			if(c != 0) {
				console.log('sort by date', c);
				return c;
			}
		}

		c = compare(a.task['title'], b.task['title']);
		if(c != 0) return c;

		return compare(a.task['_id'], b.task['_id']);
	});

	return arr;
}
function taskDelete(task, on_delete) {
	if(!confirm("Permanently delete task \"" + task.task["title"] + "\"?")) return;

	on_delete();

	task.is_deleted = true;
	view.load();

	callAPI(
		[{
			"command": "delete",
			"task_id": task.task["_id"]
		}],
		function(response) {
			console.log("response:", response);
		},
		defaultAjaxError);
}
function taskUpdateStatus(task, status_)
{
	console.log('update status');
	console.log(task);
	console.log(status_);

	task.task['status'] = status_;

	view.load();

	callAPI(
		[{
			"command": "update_status",
			"task_id": task.task["_id"],
			"status": status_
		}],
		function(result) {
			console.log('update status result:', result);

			// if success

		},
		function ajaxError(jqXHR, textStatus, errorThrown) {
			console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
			console.error('Response: ', jqXHR.responseText);
			alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
		});
}
function loadPosts(task) {
	var div = $("div#posts");
	div.children().remove();

	task.task["posts"].forEach(function(post) {
		var div_post = $("<div>");
		div_post.html(post["user_username"] + "(" + post["datetime"] + "):" + post["text"]);
		div.append(div_post);
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

	tasks_create(title, due, parent_id);
}
function handleFormTaskEditTaskCreate(event) {
	var title = $('#divTaskEditTaskCreate #inputTitle').val();
	var due   = $('#divTaskEditTaskCreate #inputDue').val();
	var parent_id = myApp.taskCurrent.task["_id"];

	console.log("handle create");
	console.log(title);
	console.log(due);
	console.log(parent_id);

	tasks_create(title, due, parent_id);
}
function setup_dragging() {
	var drag_enter = (el) => {
		console.log('drag enter');
		//el.css('background-color', 'red');
		el.data('drop').show();
	};
	var drag_leave = (el) => {
		console.log('drag leave');
		//el.css('background-color', 'blue');
		el.data('drop').hide();
	};

	window.addEventListener("mousemove", function(ev) {
		if(app.dragging != null) {
			//console.log(ev);
				
			var x = ev.pageX;
			var y = ev.pageY;
			
			$(".tasks_list").each((index, el) => {
				var o = $(el).offset();
				
				var _in = () => {
					if(x < o.left) return false;
					if(x > o.left + $(el).width()) return false;
					if(y < o.top) return false;
					if(y > o.top + $(el).height()) return false;
					return true;
				};
				
				if(_in()) {
					if($(el).data('drag_hover')) {
						// already in, do nothing
					} else {
						$(el).data('drag_hover', true);
						drag_enter($(el));
					}
				} else {
					if($(el).data('drag_hover')) {
						$(el).data('drag_hover', false);
						drag_leave($(el));
					} else {
						// already out, do nothing
					}
				}
				
			});
		}
	}, false);
}
function create_div_comments(task, texts, callback) {
	var div = $("<div>");

	texts.forEach((text) => {
		console.log(text);

		var div_comment = $("<div>");

		var div_text = $("<div>");
		div_text.text(text.d.text);

		var div_user = $("<div>");
		div_user.text(text.d.user);

		var div_date = $("<div>");
		div_date.text(text.d.data);
		
		div_comment.append(div_text);
		div_comment.append(div_user);
		div_comment.append(div_date);

		div.append(div_comment);
	});

	div.append(div_text_entry((text) => {
		create_comment(task.task._id, text);
		if(callback) {
			callback();
		}
	}));

	return div;
}
function create_comment(task_id, text) {
	var date = new Date();

	console.log(date);

	var text1 = {
		task: task_id,
		text: text,
		date: Math.round(date.valueOf() / 1000),
	};
	
	var text2 = new Text(text1);

	app.texts.push(text2);

	var command = {
		command: "texts create",
		text: text1,
	};

	callAPI([command],
		function(result)
		{
			console.log('Response:');
			console.log(result);
			text2.d._id = result[0].inserted_id;
		},
		function ajaxError(jqXHR, textStatus, errorThrown) {
			console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
			console.error('Response: ', jqXHR.responseText);
			alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
		});
}
function div_text_entry(callback) {
	var div = $("<div>");
	var textarea = $("<textarea>");
	var button = $("<button>");
	button.click((ev) => {
		callback(textarea.val());
	});
	div.append(textarea);
	div.append(button);
	return div;
}
$(function onDocReady() {
	setup_dragging();

	view = new ViewTasksLists(null);
	//view = new ViewTasksAgenda();

	view.refresh();
});



