var do_encrypt_selectors = [
   "._552m",
    "._1rv"
];

var textareaUsernameGetters = {
	'_552m' : function($textarea) {
		var $anchor = $focused.closest('.fbNubFlyoutFooter')
					.siblings('.titlebar').find('.titlebarText');
		if ($anchor.hasClass('noLink')) {
			var userInputs = $anchor.closest('.fbNubFlyoutTitlebar')
				.siblings('.fbNubFlyoutHeader').find('input[name="participants[]"]');
			return userInputs.map(function(index, elm) {
				return elm.value;
			});
		}
		return textareaUsernameGetters.fromAnchor($anchor);
	},
	'_1rv' : function() {
		var $anchor = $('#webMessengerHeaderName').find('a');
		return textareaUsernameGetters.fromAnchor($anchor);
	},
	'fromAnchor' : function($anchor) {
		var user_id = getURLParameter($anchor.attr('href'), 'id')
		if (user_id) return user_id;

		var friendUrl = $anchor.attr('href').split('/');
		return [friendUrl[friendUrl.length - 1]];
	}
}

$(function() {
	
	makeOverlays();

});

function makeOverlays() {
	$('textarea').each(function() {
		if ($(this).data('checkedOverlay')) {
			return;
		}

		var classes = $(this).attr('class').split(' ');
		var encryptClasses = classes.filter(function(elm) {
			return do_encrypt_selectors.indexOf('.' + elm) >= 0;
		});
		if (encryptClasses.length == 0) {
			$(this).data('checkedOverlay', true);
			return;
		}
		$(this).data('checkedOverlay', true);
		$(this).data('usernames', textareaUsernameGetters[encryptClasses[0]]($(this)) );

		//need a function to check if will_encrypt for usernames
		if (will_encrypt($(this).data('usernames'))) {
			makeOverlay($(this));
		}

	});
}

function makeOverlay($textarea) {
	if (!$textarea.is(':visible')) {
		return;
	}
	var $fakeblockArea = $textarea.clone();
	$textarea.after($fakeblockArea).hide();

	$fakeblockArea.data('encryptedArea', $textarea);

	$fakeblockArea.keyup(function() {
		encryptHandler($(this));
	});
	var firstInput = $textarea.val();
	encryptHandler($fakeblockArea, firstInput);
	$fakeblockArea.focus();
	$fakeblockArea.val(firstInput);
}

function will_encrypt(usernames) {
	return true;
}

function getFakeBlock($textarea) {
	//dummy function
	return $.parseJSON($textarea.val().split('|')[2]);
}

function requestEncrypt($encryptedArea, message) {
	//use this to test while extension not running
	$encryptedArea.val("|fakeblock|" + JSON.stringify({'ciphertext' : message }) + "|endfakeblock|");
	return;

		sendMessage({
			"action" : "encrypt",
			"message" : message,
			"usernames" : $encryptedArea.data('usernames')
		}, function(response) {
			encrypted = $.parseJSON(response).res;
  			$encryptedArea.val("|fakeblock|" + 
				JSON.stringify(encrypted) + 
				"|endfakeblock|"
			);
		});
	}

function encryptHandler($unencryptedArea, message) {
	var message = (message) ? message : $unencryptedArea.val();

	//send message to encrypt to josh
	encrypted = requestEncrypt($unencryptedArea.data('encryptedArea'), 
		message);
}

function getURLParameter(url, name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,null])[1]
    );
}
