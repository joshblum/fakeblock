var userInputs = [];

$(function() {
	sendMessage({
		"action" : "get_friends",
	}, function(friends) {
		for (friend in friends) {
			var userInput = $('<div class="contact">
	            <input class="select-contact" type="checkbox"/>
	            <div class="contact-name">
	            ' + friends.friend.name + '
	            </div>
	        </div>');
	        userInput.data('username', friend);
	        userInput.data('fullname', friends.friend.name);
	        userInputs.append(userInput);
		}
	});

});