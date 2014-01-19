var doEncryptDomains = [
    "facebook.com",
    "mail.google.com"
];

var EMAIL_WINDOW_SELECTOR = '.I5';
var TEXTAREA_SELECTOR = '.Am[role="textbox"][contenteditable="true"]';
var USERNAME_FIELD_SELECTOR = '.oL';

function usernameGetter($usernameField) {
    var emailSpans = $usernameField.children().toArray();
    return emailSpans.map(function(emailSpan) {
        return $(emailSpan).attr('email');
    });
}

$(function() {
    console.log('hi');
    if (doEncryptDomains.indexOf(document.domain) < 0) {
        return
    }

    $(document).on('DOMNodeInserted', function(e) {
        if ($(e.target).closest('.parseltongue-unencrypted').length > 0) {
            //don't allow insert events for objects appended to the unencrypted area to propagate
            return;
        } else if ($(e.target).parent().hasClass('parseltongue-encrypted') && 
            $(e.target).hasClass('gmail_extra')) {
            //if an old email thread gets revealed in the original textarea
            //append it to associated unencrypted area instead and reencrypt
            var $unencryptedArea = $(e.target).parent().data('unencryptedArea');
            $unencryptedArea.append($(e.target));
            // encryptHandler($unencryptedArea);
            return;
        }

        //gmail makes the first matching textarea found into the compose textarea
        //move the unencrypted textarea after the encrypted textarea
        if ($('.aO7').children(TEXTAREA_SELECTOR).length == 1) {
            $('.aO7').append($('.parseltongue-unencrypted'));
        }

        //make overlay if the email window and the associated textarea are found, and if doesn't already have overlay
        var overlayable = $(e.target).closest(EMAIL_WINDOW_SELECTOR).find(TEXTAREA_SELECTOR);
        if (overlayable.length > 0) {
            if (! overlayable.hasClass('has-overlay')) {
                var $email = overlayable.closest(EMAIL_WINDOW_SELECTOR);
                makeOverlay($email);
            } else if (overlayable.hasClass('pre-draft')) {
                if (overlayable.data('draft') === overlayable.html() ||
                    overlayable.html().indexOf('class="gmail_extra"') >= 0) {
                    //if draft has finished loading
                    overlayable.data('unencryptedArea').html(
                        overlayable.data('draft')
                    );
                    overlayable.removeClass('pre-draft');   
                } else {
                    //draft hasn't finished loading into compose window
                    overlayable.data('draft', overlayable.html());
                }

            }
        }
        
        //update usernames if (possibly) a new username has been added
        usernameHandler(e.target);
    });

    $(document).on('DOMNodeRemoved', function(e) {
        usernameHandler(e.target);
    });
});

function makeOverlay($email) {
    /* given the top-level email window, make an overlay for it */

    var $textarea = $email.find(TEXTAREA_SELECTOR);
    var $unencryptedArea = makeOverlayHtml($textarea);

    $textarea.after($unencryptedArea);
    $textarea.hide();

    //username field probably(?) hasn't loaded yet, but need to associate this unencrypted area and the username field 
    $usernameField = $email.find(USERNAME_FIELD_SELECTOR);
    if ($usernameField.length > 0) {
        $usernameField.data('unencryptedArea', $unencryptedArea);
        //this initial call may not be necessary since usernames probably haven't loaded yet
        updateUsernames($usernameField);
    }
    
    //if can't find a username field yet, default to not encrypting...username field should load later anyway
    $unencryptedArea.data('doEncrypt', false);

    $unencryptedArea.keyup(function(e) {
        encryptHandler($(this));
    });
    $textarea.addClass(FAKEBLOCK_TEXTAREA_CLASS);
    $textarea.addClass('has-overlay pre-draft');
    $textarea.data('unencryptedArea', $unencryptedArea);
}

function makeOverlayHtml($textarea) {
    /* lots of shit here to make the overlay look like the original */

    var $unencryptedArea = $textarea.clone();
    var unencrypted_id = $unencryptedArea.prop('id') + '_unencrypted';
    $unencryptedArea.attr({
        id : unencrypted_id, 
        role : 'textbox',
        contenteditable : true
    });

    $unencryptedArea.click(function(evt) {
        evt.stopPropagation();
    }).focus(function(evt) {
        evt.stopPropagation();
    });

    $unencryptedArea.css({
        'min-height' : '85px',
        'direction' : 'ltr'
    });
    $unencryptedArea.addClass('Al LW-avf parseltongue-unencrypted');

    $unencryptedArea.data('encryptedArea', $textarea);

    return $unencryptedArea;
}

function encryptHandler($unencryptedArea) {
    /* 
    handler for keyup in an unencrypted area 
    uses doEncrypt in unencrypted area's data to check if should update with ciphertext or plaintext
    */
    var $encryptedArea = $unencryptedArea.data('encryptedArea');
    var message = $unencryptedArea.html();
    var usernames = $unencryptedArea.data('usernames');
    if ($unencryptedArea.data('doEncrypt')) {
        requestEncrypt($encryptedArea, message, usernames);
    } else {
        $encryptedArea.html(message);
    }

}

function usernameHandler(emailSpan) {
    /*
    handler for an email address getting added or removed from the addressees
    updates the usernames list for the appropriate unencrypted textarea 
    */
    if ('email' in emailSpan.attributes) {
        $usernameField = $(emailSpan).parent();
        var usernameFieldClass = USERNAME_FIELD_SELECTOR.split('.')[1]
        if ($usernameField.hasClass(usernameFieldClass)) {
            updateUsernames($usernameField);
        }
    }
}

function updateUsernames($usernameField) {
    /*
    call to check if the usernames are all still valid parseltongue users
    if yes/no, update the doEncrypt field of the corresponding unencrypted textarea
    */

    //check if username field has been associated with a textarea yet
    var $unencryptedArea = $usernameField.data('unencryptedArea');
    if (! $unencryptedArea) {
        return;
    }

    var usernames = usernameGetter($usernameField);
    $unencryptedArea.data('usernames', usernames);
    requestCanEncryptFor($unencryptedArea, usernames);
}

function requestEncrypt($encryptedArea, message, usernames) {
    /*
    send message to back asking for the encrypted message
    updates the textarea with the ciphertext
    */
    sendMessage({
        "action" : "encrypt",
        "message" : message,
        "usernames" : usernames,
        "which_network" : "gmail"
    }, function(response) {
        var res = $.parseJSON(response).res;
        var msg;
        if (typeof res === "string") {
            msg = res;
        } else {
            var json_encoded = JSON.stringify(res);
            msg = FAKEBLOCK_OPEN_TAG + 
                encodeString(json_encoded) +
                FAKEBLOCK_CLOSE_TAG;
        }
        $encryptedArea.html(msg);
    });
}

function requestCanEncryptFor($unencryptedArea, usernames) {
    /*
    send message to back asking if the usernames can be encrypted for (are valid parseltongue users)
    if yes or no, updates the doEncrypt state of the corresponding unencrypted textarea, switching encryption on or off
    */
    sendMessage({
        "action" : "canEncryptFor",
        "usernames" : usernames,
        "which_network" : "gmail"
    }, function(response) {
        var res = $.parseJSON(response).res;
        if (res !== $unencryptedArea.data('doEncrypt')) {
            //TODO: will have to encrypt or decrypt the current message if state changed
        }
        $unencryptedArea.data('doEncrypt', res.can_encrypt);
    });
}