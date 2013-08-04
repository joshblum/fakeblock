var do_encrypt_selectors = [
   "._552m",
    "._1rv"
];

$(function() {
	var dummyCheck = false;
	var textareaUsernameGetters = {
		'_552m' : function($textarea) {
			var friendUrl = $focused.closest('.fbNubFlyoutFooter')
						.siblings('.titlebar').find('.titlebarText').attr('href').split('/');
			return friendUrl[friendUrl.length - 1];
		},
		'_1rv' : function() {
			var friendUrl = $('#webMessengerHeaderName').find('a').attr('href').split('/');
			return friendUrl[friendUrl.length - 1];
		}
	}
		
	$('textarea').focus(function() {
		var classes = $(this).attr('class').split(' ');
		var encryptClasses = classes.filter(function(elm) {
			return elm in textareaUsernameGetters;
		});
		if (encryptClasses.length == 0) {
			$(this).data('doCreateOverlay', false);
			return;
		}
		$(this).data('doCreateOverlay', true);
		$(this).data('usernames', [textareaUsernameGetters[encryptClasses[0]]($(this))] );

	});

	$('textarea').keyup(function(evt) {
		if (!$(this).data('doCreateOverlay')) {
			return;
		}
		//need a function to check if will_encrypt for usernames
		if (will_encrypt($(this).data('usernames'))) {
			makeAndFocusOverlay($(this), evt);
		}
	});

	function makeAndFocusOverlay($textarea, evt) {
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

		chrome.runtime.sendMessage({
			"action" : "encrypt",
			"message" : message,
			"usernames" : $encryptedArea.data('usernames')
		}, function(encrypted) {
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

});