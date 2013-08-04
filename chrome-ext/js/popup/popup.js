var userInputs = [];

$(function() {
	sendMessage({
		"action" : "get_friends",
	}, function(friends) {
		alert('hello world');
		$.each(friends, function(index, friendObj) {
			var username = Object.keys(friendObj)[0];

			var userInput = $('<div class="contact">'+
	            '<input class="select-contact" type="checkbox"/>'+
	            '<div class="contact-name">'+
	            friendObj.username +
	            '</div>' +
	        '</div>');
	        userInput.data('username', username);
	        userInput.data('fullname', friendObj.username);
	        userInputs.push(userInput);
	        alert(userInput);

		});
	});
	alert('hi');
    $(".contact").click(function() {
        $(this).css('background-color', "red");
    });
});
	