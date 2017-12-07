/*global myApp _config AmazonCognitoIdentity AWSCognito*/

var myApp = window.myApp || {};

(function indexScopeWrapper($) {
    
	var authToken;
	
    myApp.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/signin.html';
    });
	
	function taskCreate(title, due, parent_id) {
		$.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/tasks',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
				"command": "create",
				"title": title,
				"due": due,
				"parent_id": parent_id
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
            }
        });
	}
	
	function tasksList() {
        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/tasks',
            headers: {
                Authorization: authToken
            },
            data: JSON.stringify({
				"command": "list"
            }),
            contentType: 'application/json',
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
                console.error('Response: ', jqXHR.responseText);
                alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
            }
        });
    }
	
	function completeRequest(result) {
        /*var unicorn;
        var pronoun;*/
        console.log('Response received from API: ', result);
		
		console.log(JSON.parse(result));
		
		// clear list
		$("#divTasks div").remove();
		
		// clear select element
		$("#formCreateInputParent option").remove();
		
		var inputParent = $("#formCreateInputParent");
		
		inputParent.append($("<option value=\"\">None</option>"));
		
		JSON.parse(result).forEach(function(element){
			console.log(element);
			var task = element[0];
			var level = element[1];
			
			var div = $("<div class=\"task_row\">");
			
			var div_due = $("<div class=\"task_due\">");
			if(task['due']){
				div_due.html(task['due']);
			}else{
				div_due.html('none');
			}
			
			var div_title = $("<div>");
			div_title.html(task['title']);
			div_title.css("padding-left", 20 * level);
			
			div.append(div_due);
			div.append(div_title);
			
			$('#divTasks').append(div);
			
			// add option
			inputParent.append($("<option value=\""+ task["_id"] +"\">"+task["title"]+"</option>"));
		});
		
        /*unicorn = result.Unicorn;
        pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';
        displayUpdate(unicorn.Name + ', your ' + unicorn.Color + ' unicorn, is on ' + pronoun + ' way.');
        animateArrival(function animateCallback() {
            displayUpdate(unicorn.Name + ' has arrived. Giddy up!');
            myApp.map.unsetLocation();
            $('#request').prop('disabled', 'disabled');
            $('#request').text('Set Pickup');
        });*/
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
        
		taskCreate(title, due, parent_id);
	}
	
    $(function onDocReady() {
        tasksList();
		$('#formCreate').submit(handleFormCreate);
    });
    
}(jQuery));
