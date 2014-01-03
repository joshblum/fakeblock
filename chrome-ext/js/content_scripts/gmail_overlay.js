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
            var $emailWindow = $(e.target).closest(emailWindowSelectors[i]);
            var $textarea = textareaSelectors.reduce(function(prev, selector) {
                return prev.concat($(e.target).find(selector).toArray());
            }, []);

            if ($emailWindow.length > 0 && $textarea.length > 0) {
                if (! $emailWindow.hasClass('hasOverlay')) {
                    makeOverlay($emailWindow);
                }
                break;
            }
        }
        usernameHandler(e.target);
    });

    $(document).on('DOMNodeRemoved', function(e) {
        usernameHandler(e.target);
    })

});

function makeOverlay($email) {

    for (var i in textareaSelectors) {
        //ehhh this just sets the textarea to the first element inside the email whose class matches...maybe not the best
        $textarea = $email.find(textareaSelectors[i]);
        if ($textarea.length > 0) {
            break;
        }
    }

    var $unencryptedArea = $textarea.clone();
    $textarea.before($unencryptedArea);
    // $textarea.after($unencryptedArea);
    // $textarea.hide();
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
        $unencryptedArea.data('doEncrypt', false);
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
            //TODO: will have to encrypt or decrypt the current message if state changed
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

function usernameHandler(emailSpan) {
    if ('email' in emailSpan.attributes) {
        $usernameField = $(emailSpan).parent();
        matchedSelectors = Object.keys(usernameGetters).filter(function(klass) {
            return $usernameField.hasClass(klass.split('.')[1]);
        });
        //defaulting to the first selector that matches for now...
        //TODO: think about actually accounting for multiple matched selectors, if we should at all
        updateUsernames($usernameField, matchedSelectors[0]);
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
    requestCanEncryptFor($unencryptedArea, usernames);
}