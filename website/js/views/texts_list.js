
class ViewTextsList {
	constructor(container, filter) {
		this.container = container;
		this.filter = filter;
	}
	refresh() {
		var c = {
			command: 'texts find',
			filter: this.filter,
		};
		call_api([c], [(data) => {
			this.texts = data.texts.map(t => new Text(t));
			this.load();
		}])
	}
	load() {
		if(this.texts.length == 1) {
			this.load_text(this.texts[0]);
		} else if(this.texts.length > 1) {
			this.load_list();
		} else {
			this.load_text_new();
		}
	}
	load_text(text) {
		var _this = this;
		this.container.empty();

		var textarea_filt = $("<textarea>");
		var textarea_text = $("<textarea>");

		var filt = Object.assign({}, text.d);
		delete filt.text;
		delete filt._id;
		
		textarea_filt.val(JSON.stringify(filt));

		textarea_text.val(text.d.text);
		
		var button = $("<button>");
		button.text("save");
		button.click((ev) => {
			var file = JSON.parse(textarea_filt.val());
			file.text = textarea_text.val();
			
			var c = {
				command: "texts put",
				text_id: text.d._id,
				file: file,
			};
			
			call_api([c], [(data) => {
				_this.filter = {_id: text.d._id};
				_this.refresh();
			}]);
		});


		this.container.append(create_button_view_texts_list());
		this.container.append(create_button_view_tasks_lists());
		this.container.append(textarea_filt);
		this.container.append(textarea_text);
		this.container.append(button);
	}
	load_text_new() {
		var _this = this;
		this.container.empty();

		var textarea_filt = $("<textarea>");
		var textarea_text = $("<textarea>");

		textarea_filt.val(JSON.stringify(this.filter));

		var button = $("<button>");
		button.text("save");
		button.click((ev) => {
			var file = JSON.parse(textarea_filt.val());
			file.text = textarea_text.val();
			
			var c = {
				command: "texts put",
				text_id: null,
				file: file,
			};
			
			call_api([c], [(data) => {
				console.log(data);
				_this.filter = {_id: data.text_id};
				_this.refresh();
			}]);
		});

		this.container.append(create_button_view_texts_list());
		this.container.append(create_button_view_tasks_lists());
		this.container.append(textarea_filt);
		this.container.append(textarea_text);
		this.container.append(button);
	}
	load_list() {
		var _this = this;
		this.container.empty();

		this.container.append(create_button_view_tasks_lists());

		var div = $("<div>");

		div.append(this.load_filter_form());

		this.texts.forEach((text) => {
			
			var div1 = $("<div>");
			div1.addClass('texts_view_list_file');
			var table = $("<table>");
			
			Object.keys(text.d).forEach(function(key, index) {
				var tr = $("<tr>");
				var td1 = $("<td>");
				td1.text(key);
				var td2 = $("<td>");
				td2.text(text.d[key].toString());
				tr.append(td1);
				tr.append(td2);
				table.append(tr);
			});
			
			var button = $("<button>");
			button.text("open");
			button.click((ev) => {
				_this.load_text(text);
			});

			div1.append(table);
			div1.append(button);

			div.append(div1);
		});
		
		this.container.append(div);
	}
	load_filter_form() {
		var div = $("<div>");
		
		var input = $("<input type=\"text\">");
		input.val(JSON.stringify(this.filter));
		
		var button = $("<button>");
		button.text("search");
		var _this = this;
		button.click((ev) => {
			_this.filter = JSON.parse(input.val());
			_this.refresh();
		});

		div.append(input);
		div.append(button);
		return div;
	}
}

function create_button_view_texts_list() {
	var button = $("<button>");
	button.text('texts');
	button.click((ev) => {
		view = new ViewTextsList($("div#view"), {});
		view.refresh();
	});
	return button;
}

