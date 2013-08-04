var userInputs = [];

//$(function() {
//	sendMessage({
//		"action" : "get_friends",
//	}, function(friends) {
//		for (friend in friends) {
//			var userInput = $('<div class="contact">
//	            <input class="select-contact" type="checkbox"/>
//	            <div class="contact-name">
//	            ' + friends.friend.name + '
//	            </div>
//	        </div>');
//	        userInput.data('username', friend);
//	        userInput.data('fullname', friends.friend.name);
//	        userInputs.push(userInput);
//	        $('body').append(userInput);
//		}
//	});
//
//
//});


$(document).ready(function() {
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
	
