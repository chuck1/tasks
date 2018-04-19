
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
		var _this = this;
		this.container.empty();

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

			div1.append(table);
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

