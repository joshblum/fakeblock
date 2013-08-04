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
	})

	function makeAndFocusOverlay($textarea, evt) {
		if ($textarea.data('unencryptedArea')) {
			return;
		}
		var $fakeblockArea = $textarea; //make an overlay here. DEMO: for now return original text area
		$textarea.data('unencryptedArea', $fakeblockArea);//DEMO: remove this later
		$fakeblockArea.data('encryptedArea', $textarea);
		$fakeblockArea.data('usernames', $textarea.data('usernames'));

		$fakeblockArea.keyup(function(e) {
			encryptHandler($(this), e);classes
		});
		encryptHandler($fakeblockArea, evt, $textarea.val());//DEMO: remove last parameter for demo

		$fakeblockArea.focus();

		return $fakeblockArea;
	}


	function checkFakeBlock($textarea) {
		//this will be a regex to check if there's already fakeblock tags/json object set up in textarea
		if (!dummyCheck) {
			dummyCheck = true;
			return false;
		}
		return dummyCheck;
	}

	function will_encrypt(usernames) {
		return true;
	}

	function getFakeBlock($textarea) {
		//dummy function
		return $.parseJSON($textarea.val().split('|')[2]);
	}

	function requestEncrypt($encryptedArea, message, usernames) {
		chrome.runtime.sendMessage({
			"action" : "encrypt",
			"message" : message,
			"usernames" : usernames			
		}, function(encrypted) {
  			$encryptedArea.val("|fakeblock|" + 
				JSON.stringify(encrypted) + 
				"|endfakeblock|"
			);
		});
	}

	function encryptHandler($unencryptedArea, evt, demoText) {
		// var message = $unencryptedArea.val());
		//DEMO: just use above function call once we add overlay
		var fakeblockMatches = getFakeBlocksFromText($unencryptedArea.val());
		if (fakeblockMatches.length > 0) {
			var fakeblockJson = $.parseJSON(fakeblockMatches[0][1]);
			var message = fakeblockJson.ciphertext + $unencryptedArea.val().split('|')[4];
		}
		else {
			var message = $unencryptedArea.data('unencryptedArea').val();
		}

		//send message to encrypt to josh
		encrypted = requestEncrypt($unencryptedArea.data('encryptedArea'), 
			message, $unencryptedArea.data('usernames'));


	}

});