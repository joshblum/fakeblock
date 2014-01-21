var doEncryptDomains = [
    "facebook.com",
    "mail.google.com"
];

var EMAIL_WINDOW_SELECTOR = '.I5';
var TEXTAREA_SELECTOR = '.Am[role="textbox"][contenteditable="true"]';
var TOOLBAR_SELECT = ".n1tfz";
var FORMAT_BUTTON_SELECT = ".az5";

function usernameGetter($usernameField) {
    return $usernameField.find('*').filter(function(i, elm) {
        return $(elm).attr('email') !== undefined;
    }).toArray().map(function(emailSpan) {
        return $(emailSpan).attr('email');
    });
}

$(function() {
    if (doEncryptDomains.indexOf(document.domain) < 0) {
        return
    }

    $(document).on('DOMNodeInserted', function(e) {
        if ($(e.target).closest(NON_FAKEBLOCK_TEXTAREA_SELECTOR).length > 0) {
            //don't allow insert events for objects appended to the unencrypted area to propagate
            return;
        } else if ($(e.target).parent().hasClass(FAKEBLOCK_TEXTAREA_CLASS) && 
            $(e.target).hasClass('gmail_extra')) {
            //if an old email thread gets revealed in the original textarea
            //append it to associated unencrypted area instead and reencrypt
            var $unencryptedArea = $(e.target).parent().data('unencryptedArea');
            $unencryptedArea.append($(e.target));
            return;
        }

        //make overlay if the email window and the associated textarea are found, and if doesn't already have overlay
        var overlayable = $(e.target).closest(EMAIL_WINDOW_SELECTOR).find(TEXTAREA_SELECTOR);
        var email_toolbar = $(e.target).closest(EMAIL_WINDOW_SELECTOR).find(TOOLBAR_SELECT);

        if (overlayable.length == 1) {
            if (! overlayable.hasClass('has-overlay') && overlayable.attr('tabindex')) {
                //this is awkward, but we have to wait until the textarea's tabindex is set
                //so can tab to overlay but can't tab to original email
                var $email = overlayable.closest(EMAIL_WINDOW_SELECTOR);
                makeOverlay($email);
            } else if (overlayable.hasClass('pre-draft')) {

            }
        } else if (overlayable.length == 2) {
            var draftable = overlayable.filter('.pre-draft');
            if (draftable.length > 0) {
                draft_html = draftable.html()
                if ( ( draftable.data('draft') === draft_html ||
                    draft_html.indexOf('class="gmail_extra"') >= 0 ) &&
                    ( draft_html.indexOf('<wbr>') < 0 ||
                    draft_html.length - draft_html.indexOf('<wbr>') !== '<wbr>'.length) )  {
                    //if draft has finished loading
                    draftable.data('unencryptedArea').html(
                        draftable.data('draft')
                    );
                    draftable.removeClass('pre-draft');   
                } else {
                    //draft hasn't finished loading into compose window
                    draftable.data('draft', draft_html);
                }
            }

            var buttonable = overlayable.filter('.has-overlay');
            if (email_toolbar.length > 0 && buttonable.length > 0) {
                var format_button = email_toolbar.find(FORMAT_BUTTON_SELECT);
                if (!(format_button.hasClass("yupper"))) {
                    format_button.addClass("yupper");
                    var $ptButton = $('<div class="pt-buttons-wrapper" style="display:none;">' +
                    '    <div class="pt-button pt_unlocked" data-tooltip="Click me to encrypt" aria-label="Click me to encrypt" style="">' +
                    '        <img class="pt_lock_img" src="https://i.imgur.com/D95KZPO.png" style="width:100%;"/>' +
                    '    </div>' +
                    '    <div class="pt-button pt_locked" style="display:none" data-tooltip="Click me to turn off encrypt" aria-label="Click me to turn off encrypt" style="width: 22px;height: 25px;padding-top: 10px;padding-left: 8px;border-top: 1px solid rgba(134, 134, 134, 0.33);float: left;">' +
                    '        <img class="pt_lock_img" src="https://i.imgur.com/qhKbqCR.png" style="width:100%;"/>' +
                    '    </div>' +
                    '</div>');
                    format_button.before($ptButton);
                    $ptButton.find(".pt-button").css(
                        {
    //                            "top":" 1px",
                            "padding":" 10px 7px 5px 8px",
                            "width":" 22px",
                            "height":" 25px",
                            "border":" 1px solid #f5f5f5",
                            "border-top":"1px solid rgba(128, 128, 128, 0.32)",
                            "float":"right"
                        });
                    $ptButton.find('.pt-button').hover(
    //                        function(){ $(this).css('border', '1px solid gray') },
    //                        function(){ $(this).css(
    //                            {'border':'1px solid #f5f5f5',
    //                            "border-top":"1px solid rgba(128, 128, 128, 0.32)"
    //                            }) }
                        function(){ $(this).css('cursor', 'pointer') }
                    );
                    $ptButton.find('.pt_unlocked').click(function(e) { // they clicked the snake, stuff should be encrypted now
                        e.preventDefault();
                        togglePtButton($(this));
                    });
                    $ptButton.find('.pt_locked').click(function(e) { // they clicked the lock, stuff should be unencrypted now
                        e.preventDefault();
                        togglePtButton($(this));
                    });
                    bindPtButtons(buttonable, $ptButton);
                }
            
            }

        }

        //update usernames if (possibly) a new username has been added
        usernameHandler(e.target);
    });

    $(document).on('DOMNodeRemoved', function(e) {
        usernameHandler(e.target, true);
    });
});

function bindPtButtons($encryptedArea, $ptButtons) {
    /*
    initialize parseltongue buttons
    binds parseltongue buttons to the proper unencrypted textarea
    sets the default encrypt/decrypt option based on usermeta.defaultEncrypt
    shows or hides all parseltongue buttons if can encrypt for current usernames
    */
    var $unencryptedArea = $encryptedArea.data('unencryptedArea');
    $unencryptedArea.data('ptButtons', $ptButtons);
    $ptButtons.data('unencryptedArea', $unencryptedArea);
    requestDefaultEncrypt($ptButtons);
    requestCanEncryptFor($unencryptedArea);
}

function togglePtButton($ptButton) {
    $ptButton.hide();
    $ptButton.siblings().show();
    encryptHandler($ptButton.closest('.pt-buttons-wrapper').data('unencryptedArea'));
}

function makeOverlay($email) {
    /* given the top-level email window, make an overlay for it */

    var $textarea = $email.find(TEXTAREA_SELECTOR);
    var $unencryptedArea = makeOverlayHtml($textarea);

    $textarea.after($unencryptedArea);
    $textarea.hide();

    //set doencrypt to false since usernames should be empty when email first opens
    $unencryptedArea.data('doEncrypt', false);

    $unencryptedArea.keyup(function(e) {
        encryptHandler($(this));
    });
    $textarea.addClass(FAKEBLOCK_TEXTAREA_CLASS);
    $textarea.addClass('has-overlay pre-draft');
    $textarea.data('unencryptedArea', $unencryptedArea);
}

function makeOverlayHtml($textarea) {
    /* lots of shit here to make the overlay look/act like the original */

    var $unencryptedArea = $textarea.clone();
    // clear text in unencrypted area
    $unencryptedArea.text('');
    var unencrypted_id = $unencryptedArea.prop('id') + '_unencrypted';
    $unencryptedArea.attr({
        id : unencrypted_id,
        role : 'textbox',
        contenteditable : true,
        tabindex : $textarea.attr('tabindex')
    });
    $textarea.removeAttr('tabindex');

    $unencryptedArea.click(function(evt) {
        evt.stopPropagation();
    }).focus(function(evt) {
        evt.stopPropagation();
    });

    $textarea.closest('tbody').parent().closest('tbody').children('tr').first().click(function() {
        //if user clicks on email window, focus into unencrypted area
        //(TODO: this won't work if no html matched...don't know what to do then but maybe not big deal)
        $unencryptedArea.focus();
    }); 

    $unencryptedArea.css({
        'min-height' : '85px',
        'direction' : 'ltr'
    });
    $unencryptedArea.addClass(['Al', 'LW-avf', NON_FAKEBLOCK_TEXTAREA_CLASS].join(' '));

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

    //if can find button, check if button is visible and set to lock
    //otherwise do not encrypt
    var $ptButton = $unencryptedArea.data('ptButtons');
    var canEncryptButton = $ptButton ?
        $ptButton.find('.pt_locked').css('display') !== 'none' && $ptButton.css('display') !== 'none' :
        false;
    if ($unencryptedArea.data('doEncrypt') && canEncryptButton) {
        requestEncrypt($encryptedArea, message, usernames);
    } else {
        $encryptedArea.html(message);
    }

}

function usernameHandler(emailSpan, deleteEmail) {
    /*
     handler for an email address getting added or removed from the addressees
     updates the usernames list for the appropriate unencrypted textarea
     */
    var emailSpans = $(emailSpan).children().add($(emailSpan)).filter(function(i, elm) { 
        return $(elm).attr('email') !== undefined; 
    });
    //TODO: what happens if more than one email span? is this possible?
    //TODO: normalize emails in frontend too?
    if (emailSpans.length == 1) {
        $usernameField = emailSpans.parent().parent();
        var usernameToDelete = null;
        if (deleteEmail) {
            usernameToDelete = emailSpans.attr('email');
        }
        updateUsernames($usernameField, usernameToDelete);
    }
}

function updateUsernames($usernameField, usernameToDelete) {
    /*
     call to check if the usernames are all still valid parseltongue users
     if yes/no, update the doEncrypt field of the corresponding unencrypted textarea
     */

    //check if username field has been associated with a textarea yet
    var $unencryptedArea = $usernameField.data('unencryptedArea');
    if ($unencryptedArea === undefined) {
        $unencryptedArea = $usernameField.closest(EMAIL_WINDOW_SELECTOR).find(
            NON_FAKEBLOCK_TEXTAREA_SELECTOR
        );
        $usernameField.data('unencryptedArea', $unencryptedArea);
    }

    var usernames = usernameGetter($usernameField);
    var usernameDeleteIndex = usernames.indexOf(usernameToDelete);
    if (usernameDeleteIndex >= 0) {
        usernames.splice(usernameDeleteIndex, 1);
    }
    $unencryptedArea.data('usernames', usernames);
    requestCanEncryptFor($unencryptedArea);
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

function requestCanEncryptFor($unencryptedArea) {
    /*
     send message to back asking if the usernames can be encrypted for (are valid parseltongue users)
     if yes or no, updates the doEncrypt state of the corresponding unencrypted textarea, switching encryption on or off
     parseltongue buttons will show or hide accordingly
     */
    var usernames = $unencryptedArea.data('usernames') ? 
        $unencryptedArea.data('usernames') : [];
    sendMessage({
        "action" : "canEncryptFor",
        "usernames" : usernames,
    }, function(response) {
        var res = $.parseJSON(response).res;
        $unencryptedArea.data('doEncrypt', res.can_encrypt);
        var ptButtonsWrapper = $unencryptedArea.data('ptButtons');
        if (ptButtonsWrapper) {
            if (res.can_encrypt) {
                ptButtonsWrapper.show();
            } else {
                ptButtonsWrapper.hide();
            }
        }
        encryptHandler($unencryptedArea);
    });
}

function requestDefaultEncrypt($ptButtons) {
    /*
    get default setting for encrypt on or off
    show or hide $unencryptedArea's lock/snake buttons on opening compose window
    */
    sendMessage({
       "action": "getUserMeta",
   }, function(res) {
        userMeta = JSON.parse(res).res;
        if (userMeta.defaultEncrypt) {
            togglePtButton($ptButtons.find('.pt_unlocked'));
        } else {
            togglePtButton($ptButtons.find('.pt_locked'));
        }
   });
}

chrome.runtime.onMessage.addListener(function(message) {
    if ('defaultEncrypt' in message) {
        var classToToggle = message.defaultEncrypt ? '.pt_unlocked' : '.pt_locked';
        $.each($(classToToggle), function() {
            togglePtButton($(this));
        });
    }
});