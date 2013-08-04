$(function() {
	var dummyCheck = false;
	var myUsername = 'blah';
	var globalFakeblockMode = true;
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
		encryptClasses = classes.filter(function(elm) {
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
		if ($textarea.data('encryptedArea')) {
			return;
		}
		var $fakeblockArea = $textarea; //make an overlay here. DEMO: for now return original text area
		$textarea.data('encryptedArea', $fakeblockArea);
		$fakeblockArea.data('unencryptedArea', $textarea);

		$fakeblockArea.keyup(function(e) {
			encryptHandler($(this), e);
		});
		encryptHandler($fakeblockArea, evt);

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

	function createFakeBlock($unencryptedArea) {
		var fakeblock = {
			'users' : {
				'myUsername' : {}
			},
			'ciphertext' : $unencryptedArea.val()
		};
		$unencryptedArea.data('usernames').map(function(user) {
			fakeblock.users.user = {};
		});
		return fakeblock;
	}

	function will_encrypt(usernames) {
		return true;
	}

	function getFakeBlock($textarea) {
		//dummy function
		return $.parseJSON($textarea.val().split('|')[2]);
	}
	function encrypt(ciphertext, usernames) {
		//dummy function
		return {
			'users' : {},
			'ciphertext' : ciphertext
		}
	}
	function encryptHandler($encryptedArea, evt) {

		var fakeblock;
		if (!checkFakeBlock($encryptedArea)) {
			//create new fakeblock from original unencrypted area
			fakeblock = createFakeBlock($encryptedArea.data('unencryptedArea'));
		} else {
			//need json object from max
			fakeblock = getFakeBlock($encryptedArea);
			fakeblock.ciphertext = fakeblock.ciphertext + String.fromCharCode(evt.which);
		}

		var usernames = [];
		for (user in fakeblock.users) {
			usernames.push(user);
		}
		//send message to encrypt to josh
		encrypted = encrypt(fakeblock.ciphertext, usernames);
		$encryptedArea.data('unencryptedArea').val('|fakeblock|' + 
			JSON.stringify(encrypted) + 
			'|endfakeblock|'
		);

	}

});