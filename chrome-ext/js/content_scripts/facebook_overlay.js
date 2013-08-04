var do_encrypt_selectors = [
   "._552m",
    "._1rv"
];

var textareas = [];

var textareaUsernameGetters = {
    '_552m' : function($textarea) {
        var $anchor = $textarea.closest('.fbNubFlyoutFooter')
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
        var user_id = getURLParameter($anchor.attr('href'), 'id');
        if (user_id !== "null") return user_id;

        var friendUrl = $anchor.attr('href').split('/');
        return [friendUrl[friendUrl.length - 1]];
    }
}

$(function() {
    $($('textarea')[0]).focus().trigger('keydown');
    makeOverlays();
    $('input[value="Reply"]').click(function() {
        replyHandler();
    });
    $('.emoteTogglerImg')[0].remove();
});

function replyHandler() {
    $('.lastEdited').val('').focus();    
    setTimeout(function() {
    	$('.lastEdited').data('encryptedArea').val('');
    }, 10);
}

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
        makeOverlay($(this));
        $($('textarea')[0]).hide();
    });
}

function makeOverlay($textarea) {
    // if (!$textarea.is(':visible')) {
    //     return;
    // }
    var $fakeblockArea = $textarea.clone();
    $textarea.after($fakeblockArea);
    // $textarea.hide();
    $fakeblockArea.data('encryptedArea', $textarea);

    $fakeblockArea.keyup(function(e) {
    	if (e.which == 13 && $('._1ri').css('marginLeft') === "15px") {
			$('input[value="Reply"]').click();
    	}
        encryptHandler($(this));
    });
    textareas.push($fakeblockArea);
    // $textarea.focus(function() {
    // 	$fakeblockArea.focus()
    // });
}

function requestEncrypt($unencryptedArea, message) {
	var $encryptedArea = $unencryptedArea.data('encryptedArea');
    sendMessage({
        "action" : "encrypt",
        "message" : message,
        "usernames" : $encryptedArea.data('usernames')
    }, function(response) {
        var res = $.parseJSON(response).res;
        var msg;
        $encryptedArea.show().focus().trigger("keydown");
        if (typeof res === "string") {
            msg = res;
        } else {
            msg = "|fakeblock|" + 
                JSON.stringify(res) + 
                "|endfakeblock|"
        }
        $encryptedArea.val(msg);
        $unencryptedArea.focus();
        $encryptedArea.hide();
    });
}

function encryptHandler($unencryptedArea) {
    var message = $unencryptedArea.val();
    for (var i=0; i < textareas.length; i++) {
    	textareas[i].removeClass('lastEdited');
    }
    $unencryptedArea.addClass('lastEdited');

    requestEncrypt($unencryptedArea, message);
}

function getURLParameter(url, name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,null])[1]
    );
}
