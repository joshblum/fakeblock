var doEncryptDomains = [
    "mail.google.com"
];

var EMAIL_WINDOW_CLASS = 'I5';
var TEXTAREA_SELECTOR = '.Am[role="textbox"][contenteditable="true"]';
var TOOLBAR_CLASS = "n1tfz";
var FORMAT_BUTTON_CLASS = "az5";
var USERNAME_FIELD_CLASS = 'vR';
var COMPOSE_FROM_EMAIL_CLASS = 'az2';
var PAGE_FROM_EMAIL_CLASS = 'msg';
var GMAIL_TOOLBAR_CLASS = 'gU';

var TO_DISABLED_TOOLTIP = 'Not all recipients are Parseltongue users';
var FROM_DISABLED_TOOLTIP = 'Visit your settings to register this "From" email address'; 

var PT_BUTTON_HTML = '<td class="pt-buttons-wrapper">' +
    '    <div class="pt-button pt-disabled" data-tooltip="' + FROM_DISABLED_TOOLTIP + '" aria-label="' + FROM_DISABLED_TOOLTIP  + '">' +
    '        <img class="pt-button-img" style="width:100%;"/>' +
    '    </div>' +
    '    <div class="pt-button pt-enabled">' +
    '    <div class="pt-unlocked" data-tooltip="Encrypt email" aria-label="Encrypt email">' +
    '        <img class="pt-button-img" style="width:100%;"/>' +
    '    </div>' +
    '    <div class="pt-locked" style="display:none" data-tooltip="Decrypt email" aria-label="Decrypt email">' +
    '        <img class="pt-button-img" style="width:100%;"/>' +
    '    </div>' +
    '    </div>' +
    '</td>';

var doEncryptMap = {};
var canEncryptFromMap = {};
var canEncryptToMap = {};
var tabIndexMap = {};
var draftMap = {};

$(function() {
    if (doEncryptDomains.indexOf(document.domain) < 0) {
        return;
    }

    $(document).on('DOMNodeInserted', function(e) {
        // check if the draft text is still being loaded
        var loadingDraft = getEncryptedAreaFor($(e.target)).hasClass(PRE_DRAFT_CLASS);
        if ($(e.target).closest(getSelectorForClass(NON_FAKEBLOCK_TEXTAREA_CLASS)).length > 0) {
            // don't allow insert events for objects appended to the unencrypted area to propagate
            return;
        } else if ($(e.target).parent().hasClass(FAKEBLOCK_TEXTAREA_CLASS) &&
            $(e.target).hasClass('gmail_extra') && !loadingDraft) {
            // if an old email thread gets revealed in the original textarea
            var $unencryptedArea = getUnencryptedAreaFor($(e.target));
            // if encryption is on, append the old email thread div to the overlay
            if (getWillEncryptFor($unencryptedArea)) {
                $unencryptedArea.append($(e.target));
            // if encryption is off, explicitly decrypt any encrypted old email thread text in original textarea
            //   since encryption is disabled in the original textarea
            } else {
                decryptElements($(e.target));
            }
            return;
        }

        var $overlayable = $(e.target).closest(getSelectorForClass(EMAIL_WINDOW_CLASS)).find(TEXTAREA_SELECTOR);

        if ($overlayable.length > 0) {
            loginPrompt();
        }

        if ($overlayable.length == 1) {
            // make overlay if the email window and the associated textarea are found, and if doesn't already have overlay
            // this is awkward, but we have to wait until the textarea's tabindex is set
            if (!$overlayable.hasClass('has-overlay') && $overlayable.attr('tabindex')) {
                var $email = $overlayable.closest(getSelectorForClass(EMAIL_WINDOW_CLASS));
                makeOverlay($email);
            }

        } else if ($overlayable.length == 2) {

            processDraft($overlayable);

            var $email_toolbar = $(e.target).closest(getSelectorForClass(EMAIL_WINDOW_CLASS)).find(getSelectorForClass(TOOLBAR_CLASS));
            var $buttonable = $overlayable.filter('.has-overlay');
            if ($email_toolbar.length > 0 && $buttonable.length > 0) {
                makePtButtons($buttonable, $email_toolbar);

            }

        }

        if ($(e.target).hasClass(USERNAME_FIELD_CLASS)) {
            //update usernames if (possibly) a new username has been added
            usernameHandler($(e.target));
        } else if (getEmailFromString($(e.target).text()) !== null) {
            var $unencryptedArea = getUnencryptedAreaFor($(e.target));
            canEncryptHandler($unencryptedArea);
        }

    });

    $(document).on('DOMNodeRemoved', function(e) {
        if ($(e.target).hasClass(USERNAME_FIELD_CLASS)) {
            usernameHandler($(e.target), true);
        }

    });
});

function processDraft($overlayable) {
    var $draftable = $overlayable.filter(getSelectorForClass(PRE_DRAFT_CLASS));
    if ($draftable.length == 0) {
        return;
    }

    var draft_html = $draftable.html();

    if ((getDraftFor($draftable) === draft_html ||
            draft_html.indexOf('class="gmail_extra"') >= 0) &&
        (draft_html.indexOf(DRAFT_SEPARATOR) < 0 ||
            draft_html.length - draft_html.lastIndexOf(DRAFT_SEPARATOR) !== DRAFT_SEPARATOR.length)) {

        // if draft has finished loading, try to decrypt the draft
        // depending on if decryption is successful, show/hide overlay and toggle parseltongue buttons
        decryptElements($draftable);

    } else {
        //draft hasn't finished loading into compose window
        setDraftFor($draftable, draft_html);
    }
}

function makePtButtons($buttonable, $email_toolbar) {
    var format_button = $email_toolbar.find(getSelectorForClass(FORMAT_BUTTON_CLASS));
    if (!(format_button.hasClass("has-pt-buttons"))) {
        format_button.addClass("has-pt-buttons");
        var $ptButton = $(PT_BUTTON_HTML);
        $ptButton.addClass(GMAIL_TOOLBAR_CLASS);
        // $ptButton.hide();

        format_button.before($ptButton);

        $ptButton.find(".pt-button").css({
            'padding': '10px 7px 5px 8px',
            'width': ' 22px',
            'height': ' 25px',
            'float': 'right',
            'cursor': 'pointer',
        });
        $ptButton.find('.pt-disabled').css({
            'cursor': 'default',
            'opacity': 0.5,
        });

        var disabledImgSrc = chrome.extension.getURL('img/snake-btn.png');
        var unlockedImgSrc = chrome.extension.getURL('img/snake-btn.png');
        var lockedImgSrc = chrome.extension.getURL('img/snake-icon.png');

        $ptButton.find('.pt-unlocked').click(function(e) { // they clicked the snake, stuff should be encrypted now
            e.preventDefault();
            togglePtButton($(this), true);
        }).find('.pt-button-img').attr('src', unlockedImgSrc); // set snake image
        $ptButton.find('.pt-locked').click(function(e) { // they clicked the lock, stuff should be unencrypted now
            e.preventDefault();
            togglePtButton($(this), false);
        }).find('.pt-button-img').attr('src', lockedImgSrc); // set lock image

        $ptButton.find('.pt-disabled').find('.pt-button-img').attr('src', disabledImgSrc);

        bindPtButtons($ptButton);
    }

}

function bindPtButtons($ptButtons) {
    /*
    initialize parseltongue buttons
    shows or hides all parseltongue buttons if can encrypt for current usernames
    (doesn't set defaultEncrypt since must wait for draft to finish loading)
    */
    var $unencryptedArea = getUnencryptedAreaFor($ptButtons);
    canEncryptHandler($unencryptedArea);
}

function makeOverlay($email) {
    /* given the top-level email window, make an overlay for it */

    var $textarea = $email.find(TEXTAREA_SELECTOR);
    var $unencryptedArea = makeOverlayHtml($textarea);

    $textarea.after($unencryptedArea);

    $unencryptedArea.keyup(function(e) {
        encryptHandler($(this));
    });

    // initialize all encrypt settings to false at first
    // when usernames are added/encrypt button is clicked, this will toggle to true
    setCanEncryptToFor($unencryptedArea, false);
    setCanEncryptFromFor($unencryptedArea, false);
    setDoEncryptFor($unencryptedArea, false);

    $textarea.addClass(FAKEBLOCK_TEXTAREA_CLASS).addClass(PRE_DRAFT_CLASS);
    $textarea.addClass('has-overlay');
}

function toggleEnablePtButton($ptButtons, enablePtBtn) {
    var selectorToShow = '.pt-disabled';
    var selectorToHide = '.pt-enabled';
    if (enablePtBtn) {
        selectorToShow = '.pt-enabled';
        selectorToHide = '.pt-disabled';
    }
    var $toShow = $ptButtons.find(selectorToShow);
    var $toHide = $ptButtons.find(selectorToHide);

    $toShow.show();
    $toHide.hide();
}

function togglePtButton($ptButton, doEncrypt) {
    $ptButton.hide();
    $ptButton.siblings().show();

    var $unencryptedArea = getUnencryptedAreaFor($ptButton);
    var oldEncrypt = getWillEncryptFor($unencryptedArea);
    setDoEncryptFor($unencryptedArea, doEncrypt);
    toggleEncrypt($unencryptedArea, oldEncrypt);
}

function toggleOverlay($unencryptedArea, doShow) {
    /*
    UI actions after a state transition of 'willEncrypt'
    shows/hides the unencrypted/encrypted areas
    updates the tabindex for normal textarea behavior

    encrypts the email if showing the unencrypted overlay ('willEncrypt' is true)
    */
    var $encryptedArea = getEncryptedAreaFor($unencryptedArea);
    var $toShow = $unencryptedArea;
    var $toHide = $encryptedArea;
    if (!doShow) {
        $toShow = $encryptedArea;
        $toHide = $unencryptedArea;
    }

    $toShow.html($toHide.html());
    $toShow.attr({
        'tabindex': getTabIndexFor($unencryptedArea),
    });
    $toHide.hide();
    $toShow.show();

    if (doShow) {
        encryptHandler($unencryptedArea);
    }

    // TODO: implement a real way of calculating cursor position
    // this is temporary logic to focus into an empty textarea (not a draft)
    if (doShow && $.trim($unencryptedArea.justtext()).length == 0 &&
        $(document.activeElement).hasClass(FAKEBLOCK_TEXTAREA_CLASS)) {
        $toShow.focus();
    }

}

function toggleDisabledTooltip($ptButtons, showToTooltip) {
    var msg = FROM_DISABLED_TOOLTIP;
    if (showToTooltip) {
        msg = TO_DISABLED_TOOLTIP;
    }

    var $ptBtn = $ptButtons.find('.pt-disabled');
    $ptBtn.attr('data-tooltip', msg);
} 

function toggleEncrypt($unencryptedArea, oldEncrypt) {
    /*
    calls any necessary action after a state transition of 'willEncrypt'
    calls 'show' or 'hide' for the overlay toggle 
    */
    var encrypt = getWillEncryptFor($unencryptedArea);
    if (oldEncrypt === encrypt) {
        return;
    }
    toggleOverlay($unencryptedArea, encrypt);
}

function makeOverlayHtml($textarea) {
    /* lots of shit here to make the overlay look/act like the original */

    var $unencryptedArea = $textarea.clone();
    // clear text in unencrypted area
    $unencryptedArea.text('');
    var unencrypted_id = $unencryptedArea.prop('id') + '_unencrypted';
    $unencryptedArea.attr({
        id: unencrypted_id,
        role: 'textbox',
        contenteditable: true,
    });
    $unencryptedArea.hide();
    // save the textarea tabindex so we can use it later while showing/hiding the overlay
    setTabIndexFor($unencryptedArea, $textarea.attr('tabindex'));

    $unencryptedArea.click(function(evt) {
        evt.stopPropagation();
    }).focus(function(evt) {
        evt.stopPropagation();
    });

    $textarea.closest('tbody').parent().closest('tbody').children('tr').first().click(function() {
        //if user clicks on email window, focus into unencrypted area
        // TODO: this won't work if no html matched...don't know what to do then but maybe not big deal)
        $unencryptedArea.focus();
    });

    $unencryptedArea.css({
        'min-height': '85px',
        'direction': 'ltr',
    });
    $unencryptedArea.addClass(['Al', 'LW-avf', NON_FAKEBLOCK_TEXTAREA_CLASS].join(' '));

    return $unencryptedArea;
}

function encryptHandler($unencryptedArea) {
    /* 
     handler for keyup in an unencrypted area
     assumes that current state for 'willEncrypt' is true, since if user 
     is able to type in the unencrypted overlay, should always encrypt
     */
    var $encryptedArea = getEncryptedAreaFor($unencryptedArea);
    var message = $unencryptedArea.html();
    var usernames = getUsernamesFor($unencryptedArea);

    requestEncrypt($encryptedArea, message, usernames);
}

function usernameHandler($emailSpan, deleteEmail) {
    /*
     handler for an email address getting added or removed from the addressees
     calls canEncryptHandler to check if new list of current usernames are all parseltongue users 
     if deleteEmail is true, then the username stored in $emailSpan will be removed from list of usernames found by
     canEncryptHandler 
     */
    var $unencryptedArea = $emailSpan.closest(getSelectorForClass(EMAIL_WINDOW_CLASS)).find(getSelectorForClass(NON_FAKEBLOCK_TEXTAREA_CLASS));
    if (deleteEmail) {
        var usernameToDelete = $emailSpan.children().add($emailSpan).filter(function(i, elm) {
            return $(elm).attr('email') !== undefined;
        }).attr('email');
    }
    canEncryptHandler($unencryptedArea, usernameToDelete);
}

function canEncryptHandler($unencryptedArea, usernameToDelete) {
    /*
    requests canEncryptFor to see if all usernames for an unencrypted area are pt users
    if usernameToDelete is specified, then doesn't include that username in the request 
    */
    var usernameDict = {
        'to' : getToUsernamesFor($unencryptedArea, usernameToDelete),
        'from' : getFromUsernamesFor($unencryptedArea),
    };
    requestCanEncryptFor($unencryptedArea, usernameDict);
}

function getUsernamesFor($unencryptedArea, usernameToDelete) {
    /*
    Get all usernames, recipients and sender, for a textarea.
    May contain duplicates if sender address matches a recipient address, but duplicates in recipient
    addresses are removed
    */
    return getFromUsernamesFor($unencryptedArea)
        .concat(getToUsernamesFor($unencryptedArea, usernameToDelete));
}

function getFromUsernamesFor($unencryptedArea) {
    /*
    Try to return the from email address. Tries to find a match in this order
        -looking at 'from' field in a compose window, needed if multiple addresses on one gmail
        -looking for the primary account email in a div on the page
        -if neither is found, return empty list 
    Returns a list for consistency with 'getToUsernamesFor'
    */
    var $fromElm = $unencryptedArea
        .closest(getSelectorForClass(EMAIL_WINDOW_CLASS))
        .find(getSelectorForClass(COMPOSE_FROM_EMAIL_CLASS));

    if (getEmailFromString($fromElm.text()) === null) {
        $fromElm = $(getSelectorForClass(PAGE_FROM_EMAIL_CLASS));
    }

    var emailToReturn = []
    var email = getEmailFromString($fromElm.text());
    if (email != null) {
        emailToReturn.push(email);
    }

    return emailToReturn;
}

function getToUsernamesFor($unencryptedArea, usernameToDelete) {
    /*
    returns usernames currently on the page for an unencrypted area
    normalizes email addresses to all lower case
    removes duplicates and undefined email addresses 
        (the invalid email addresses according to gmail)

    if usernameToDelete is defined, then remove only one copy of it from list
    */
    var $usernameElms = $unencryptedArea
        .closest(getSelectorForClass(EMAIL_WINDOW_CLASS))
        .find(getSelectorForClass(USERNAME_FIELD_CLASS))
        .find('*')
        .filter(function(i, elm) {
            return $(elm).attr('email') !== undefined;
        });
    var usernames = $usernameElms.toArray().map(function(elm) {
        return $(elm).attr('email').toLowerCase();
    });

    if (usernameToDelete) {
        var usernameDeleteIndex = usernames.indexOf(usernameToDelete);
        if (usernameDeleteIndex >= 0) {
            usernames.splice(usernameDeleteIndex, 1);
        }
    }

    var usernamesToReturn = [];

    for (var i in usernames) {
        if (usernames.indexOf(usernames[i]) == i) {
            usernamesToReturn.push(usernames[i]);
        }
    }

    return usernamesToReturn;
}

function getWillEncryptFor($unencryptedArea) {
    return getMapValueFor($unencryptedArea, doEncryptMap) && 
        getMapValueFor($unencryptedArea, canEncryptToMap) &&
        getMapValueFor($unencryptedArea, canEncryptFromMap);
}

function setDoEncryptFor($unencryptedArea, doEncrypt) {
    return setMapValueFor($unencryptedArea, doEncryptMap, doEncrypt);
}

function setCanEncryptToFor($unencryptedArea, canEncrypt) {
    return setMapValueFor($unencryptedArea, canEncryptToMap, canEncrypt);
}

function setCanEncryptFromFor($unencryptedArea, canEncrypt) {
    return setMapValueFor($unencryptedArea, canEncryptFromMap, canEncrypt);
}

function getTabIndexFor($unencryptedArea) {
    return getMapValueFor($unencryptedArea, tabIndexMap);
}

function setTabIndexFor($unencryptedArea, tabIndex) {
    return setMapValueFor($unencryptedArea, tabIndexMap, tabIndex);
}

function getMapValueFor($unencryptedArea, map) {
    var id = $unencryptedArea.prop('id');
    if (id && id in map) {
        return map[id]
    }
    return false;
}

function setMapValueFor($unencryptedArea, map, value) {
    var id = $unencryptedArea.prop('id');
    map[id] = value;
}

function getEncryptedAreaFor($elm) {
    return $elm.closest(getSelectorForClass(EMAIL_WINDOW_CLASS)).find(getSelectorForClass(FAKEBLOCK_TEXTAREA_CLASS));
}

function getPtButtonsFor($unencryptedArea) {
    return $unencryptedArea.closest(getSelectorForClass(EMAIL_WINDOW_CLASS)).find('.pt-buttons-wrapper');
}

function getDraftFor($encryptedArea) {
    var id = $encryptedArea.prop('id');
    if (id in draftMap) {
        return draftMap[id];
    }
    return null;
}

function setDraftFor($encryptedArea, draft) {
    draftMap[$encryptedArea.prop('id')] = draft;
}

function getUnencryptedAreaFor($elm) {
    return $elm.closest(getSelectorForClass(EMAIL_WINDOW_CLASS)).find(getSelectorForClass(NON_FAKEBLOCK_TEXTAREA_CLASS));
}

function requestEncrypt($encryptedArea, message, usernames) {
    /*
     send message to back asking for the encrypted message
     updates the textarea with the ciphertext
     */
    sendMessage({
        "action": "encrypt",
        "message": message,
        "usernames": usernames,
    }, function(response) {
        var res = $.parseJSON(response).res;
        var msg;
        if (typeof res === "string") {
            msg = res;
        } else {
            var cipher_text = res.cipher_text;
            msg = FAKEBLOCK_OPEN_TAG +
                encodeString(cipher_text) +
                FAKEBLOCK_CLOSE_TAG;
        }
        $encryptedArea.html(msg);
    });
}

function requestCanEncryptFor($unencryptedArea, usernames) {
    /*
     send message to back asking if the usernames can be encrypted for (are valid parseltongue users)
     if yes or no, updates the buttons of the unencrypted textarea, switching encryption on or off
     parseltongue buttons will show or hide accordingly
     */
    sendMessage({
        "action": "canEncryptFor",
        "usernames": usernames,
    }, function(response) {
        var res = $.parseJSON(response).res;
        var $ptButtonsWrapper = getPtButtonsFor($unencryptedArea);
        if ($ptButtonsWrapper.length > 0) {
            // if the usernames given can't be encrypted for, then show the 'from' or 'to' tooltip on disabled btn
            // if the usernames can be encrypted for, then show the opposite tooltip 
            toggleDisabledTooltip($ptButtonsWrapper, res.can_encrypt_from); 
            toggleEnablePtButton($ptButtonsWrapper, res.can_encrypt_from && res.can_encrypt_to);
        }

        var oldEncrypt = getWillEncryptFor($unencryptedArea);
        setCanEncryptFromFor($unencryptedArea, res.can_encrypt_from);
        setCanEncryptToFor($unencryptedArea, res.can_encrypt_to);
        toggleEncrypt($unencryptedArea, oldEncrypt);
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
        var $ptButton;
        var defaultEncrypt = userMeta.defaultEncrypt != null ? userMeta.defaultEncrypt : false;
        if (defaultEncrypt) {
            $ptButton = $ptButtons.find('.pt-unlocked');
        } else {
            $ptButton = $ptButtons.find('.pt-locked');
        }
        togglePtButton($ptButton, defaultEncrypt);
    });
}

chrome.runtime.onMessage.addListener(function(message) {
    if ('defaultEncrypt' in message) {
        var classToToggle = message.defaultEncrypt ? '.pt-unlocked' : '.pt-locked';
        $.each($(classToToggle), function() {
            togglePtButton($(this), message.defaultEncrypt);
        });
    }
});