var doEncryptDomains = [
    "facebook.com",
    "mail.google.com"
];
var emailWindowSelectors = [
    '.I5'
];
var textareaSelectors = [
    '.Am'
];

var usernameGetters = {
    '.oL' : function($usernameField) {
        var emailSpans = $usernameField.children().toArray();
        return emailSpans.map(function(emailSpan) {
            return $(emailSpan).attr('email');
        });
    }
}

$(function() {
    console.log('hi');
    if (doEncryptDomains.indexOf(document.domain) < 0) {
        return
    }

    $(document).on('DOMNodeInserted', function(e) {
        for (var i in emailWindowSelectors) {
            var $email = $(e.target).closest(emailWindowSelectors[i]);
            if ($email.length > 0) {
                if (! $email.hasClass('hasOverlay')) {
                    makeOverlay($email, textareaSelectors[i]);
                }
                break;
            }
        }
    });

    // $(document).on('DOMNodeRemoved', function(e) {
    //     if (e.target.tagName === "TEXTAREA") {
    //         //unfortunately nonspecific to the textarea that actually got removed from the page
    //         for (var selector in usernameGetters) {
    //             $(selector).each(function(usernameField) {
    //                 updateUsernames($(usernameField), selector);
    //             })
    //         }
    //     }
    // });
});

function makeOverlay($email, selector) {

    for (var i in textareaSelectors) {
        //ehhh this just sets the textarea to the first element inside the email whose class matches...maybe not the best
        $textarea = $email.find(textareaSelectors[i]);
        if ($textarea.length > 0) {
            break;
        }
    }
    var $unencryptedArea = $textarea.clone();
    $textarea.after($unencryptedArea);
    $textarea.hide();
    $unencryptedArea.data('encryptedArea', $textarea);

    for (var selector in usernameGetters) {
        $usernameField = $email.find(selector);
        if ($usernameField.length > 0) {
            //do initial call to get addresses and decide whether or not to encrypt
            updateUsernames($usernameField, selector, $unencryptedArea);
            break;
        }
    }
    
    //what should happen if fail to find username field? for now, set doEncrypt to false I guess :/
    if ($unencryptedArea.data('doEncrypt') === undefined) {
        $unencrypted.data('doEncrypt', false);
    }

    $unencryptedArea.keyup(function(e) {
        encryptHandler($(this));
    });

    $email.addClass('hasOverlay');
}

function requestEncrypt($encryptedArea, message, usernames) {
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
            msg = "|fakeblock|" + 
                encodeString(json_encoded) +
                "|endfakeblock|";
        }
        $encryptedArea.text(msg);
    });
}

function requestCanEncryptFor($unencryptedArea, usernames) {
    sendMessage({
        "action" : "can_encrypt_for",
        "usernames" : usernames,
        "which_network" : "gmail"
    }, function(response) {
        var res = $.parseJSON(response).res;
        if (res !== $unencryptedArea.data('doEncrypt')) {
            //will have to encrypt or decrypt the current message if state changed
        }
        $unencryptedArea.data('doEncrypt', res.can_encrypt);
    });
}

function encryptHandler($unencryptedArea) {
    var $encryptedArea = $unencryptedArea.data('encryptedArea');
    var message = $unencryptedArea.text();
    var usernames = $unencryptedArea.data('usernames');
    if ($unencryptedArea.data('doEncrypt')) {
        requestEncrypt($encryptedArea, message, usernames);
    } else {
        $encryptedArea.text(message);
    }

}

function updateUsernames($usernameField, selector, $unencryptedArea) {
    var usernames = usernameGetters[selector]($usernameField);

    //give username field a reference to the unencrypted area so it can update usernames on change event
    if ($unencryptedArea) {
        $usernameField.data('unencryptedArea', $unencryptedArea);
    } else {
        $unencryptedArea = $usernameField.data('unencryptedArea');
    }

    $unencryptedArea.data('usernames', usernames);
    var doEncrypt = requestCanEncryptFor(usernames);
    //TODO: must decrypt or encrypt if doEncrypt has changed
    $unencryptedArea.data('doEncrypt', doEncrypt);
}