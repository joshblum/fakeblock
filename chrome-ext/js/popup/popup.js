var userInputs = [];

$(function() {
	sendMessage({
		"action" : "get_friends",
	}, function(response) {
		friends = $.parseJSON(response).res;
		$.each(friends, function(index, friendObj) {
			var username = Object.keys(friendObj)[0];

			var userInput = $('<div class="contact">'+
	            '<input class="select-contact" type="checkbox"/>'+
	            '<div class="contact-name">'+
	            friendObj[username] +
	            '</div>' +
	        '</div>');
	        userInput.data('username', username);
	        userInput.data('fullname', friendObj[username]);
	        userInputs.push(userInput);

		});
	});

    $(".contact").click(function() {
        if ($(this).hasClass("clicked")) {
            $(this).removeClass("clicked");
            $(this).find("input").prop('checked', false);
        }
        else {
            $(this).addClass("clicked");
            $(this).find("input").prop('checked', true);
        }
    });
});
	
