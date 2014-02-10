var DRAFT_SEPARATOR_REGEX = '(' + DRAFT_SEPARATOR + ')?';
var PT_HTML_REGEX = new RegExp(escapeString(FAKEBLOCK_OPEN_TAG.split('').join(DRAFT_SEPARATOR_REGEX)) +
    '(.*)' +
    escapeString(FAKEBLOCK_CLOSE_TAG.split('').join(DRAFT_SEPARATOR_REGEX)),
    'g'
);
var PT_TEXT_REGEX = new RegExp(escapeString(getTextFromHtml(FAKEBLOCK_OPEN_TAG)) +
    '(.*)' +
    escapeString(getTextFromHtml(FAKEBLOCK_CLOSE_TAG))
);

function escapeString(str) {
    /*
     escape strings for a regex
     */
    // escape all pipes
    return str.replace(/\|/g, '\\|');
}

function getTextFromHtml(html) {
    /*
     returns the text of the given html, with all html tags stripped
     returns null if html is null
     */
    if (html == null) {
        return null;
    }
    var $dummyDiv = $('<div>' + html + '</div>');
    return $dummyDiv.text();
}

jQuery.fn.justtext = function() {
    /* http://stackoverflow.com/questions/11362085/jquery-get-text-for-element-without-children-text */
    return $(this).clone()
        .children()
        .remove()
        .end()
        .text();

};


/****** stuff for finding fakeblocks and parsing them *****************************************************************/

function getDivsContainingFakeBlock($container) {
    /* 
     get divs that are all of the following:
     -immediate parent of a fakeblock to be decrypted
     -not in the encrypted textarea overlay
     */
    return $container.find('div').add($container).filter(function(i, elm) {
        var isEncrypted = PT_TEXT_REGEX.test($(elm).justtext());

        return isEncrypted &&
            $(elm).closest(getSelectorForClass(FAKEBLOCK_TEXTAREA_CLASS)).length == 0;
    });
}

// dear stephanie, I know you will hate this. I don't like it either :p
// however, I have no idea why matching the second time finds fakeblocks sometimes, where the first attempt did not
// try it for yourself, if you remove the second attempt...
// some previews randomly won't decrypt & when you click on an email it won't click. If you know the underlying issue
// that is great, but in the mean time I am confused and this works for some reason.
function matchFakeBlock(some_text) {
    var result = PT_HTML_REGEX.exec(some_text);
    if (result == null) {
        result = PT_HTML_REGEX.exec(some_text);
    }
    return result;
}

function getHtmlToReplace($encryptedElm) {
    /*
     returns an array of the encrypted parts of the html in $encryptedElm
     */
    var all_html = $encryptedElm.html();
    var to_return = [];
    var result = matchFakeBlock(all_html);

    while (result != null) {
        to_return.push(result[0]);
        result = PT_HTML_REGEX.exec(all_html);
    }

    return to_return;
}

function getEncryptedJson(encryptedText) {
    /*
     given an encryped parseltongue block of text
     return the json holding the ciphertext, etc.
     */
    var match = PT_TEXT_REGEX.exec(encryptedText);
    if (!match) {
        return null;
    }
    var byte_str = match[1];
    var json = decodeByteString(byte_str);
    var to_return = $.parseJSON(json);
    return to_return;
}


function decryptHandler($container) {
    /*
     try and decrypt all possible DOM elements in $container
     finds and replaces all matching parseltongue blocks
     */
    var $encryptedElms = getDivsContainingFakeBlock($container);
    if ($encryptedElms.length == 0) {
        return;
    }
    decryptElements($encryptedElms);
}

// dryRun=True, means return array of encryptedJson, one for each encrypted Element (used to decrypt previews)
// otherwise dryRun=False, means it will actually do the decryption and then alter the page
function decryptElements($encryptedElms, isDraft) {
    var decryptDict = {};
    $.each($encryptedElms, function(i, elm) {

        var htmlsToReplace = getHtmlToReplace($(elm));

        var isEncryptedDraft = $(elm).html().indexOf(htmlsToReplace[0]) == 0;
        if (!isEncryptedDraft) {
            setDraftStateFor($(elm), false);
        }

        var encryptedTexts = htmlsToReplace.map(function(html) {
            return getTextFromHtml(html);
        });


        for (var j in htmlsToReplace) {
            if (encryptedTexts[j] == null) {
                continue;
            }
            var encryptedJson = getEncryptedJson(encryptedTexts[j]);
            decryptEncryptedHtml($(elm), htmlsToReplace[j], encryptedJson);
        }
    });
}


function decryptEncryptedHtml($encryptedElm, htmlToReplace, encryptedJson) {
    /*
     given a DOM element with encrypted content, the encrypted html content to replace,
     and the text of the encrypted html, send a message to decrypt the encrypted text
     and replace the encrypted html of the element if successful
     */
    sendMessage({
        'action': 'decrypt',
        'json': encryptedJson
    }, function(response) {
        var isEncryptedDraft = false;
        var decryptedText = $.parseJSON(response).res;
        if (decryptedText == null) {
            setDraftStateFor($encryptedElm, isEncryptedDraft);
            return;
        }

        var allHtml = $encryptedElm.html();
        var decryptedHtml = allHtml.replace(htmlToReplace, decryptedText);
        $encryptedElm.html(decryptedHtml);

        isEncryptedDraft = allHtml.indexOf(htmlToReplace) == 0 &&
            $encryptedElm.closest(getSelectorForClass(FAKEBLOCK_TEXTAREA_CLASS)).length > 0;
        setDraftStateFor($encryptedElm, isEncryptedDraft);

        if ($encryptedElm.closest(getSelectorForClass(NON_FAKEBLOCK_TEXTAREA_CLASS)).length > 0) {
            var $unencryptedArea = getUnencryptedAreaFor($encryptedElm);
            encryptHandler($unencryptedArea);
        }
    });
}

function setDraftStateFor($draftable, isEncrypted) {
    if (!$draftable.hasClass(PRE_DRAFT_CLASS)) {
        return;
    }
    var draftText = $draftable.justtext();

    var ptButtonSelector = isEncrypted ? '.pt-unlocked' : '.pt-locked';
    var $ptButtons = getPtButtonsFor($draftable);
    var $ptButton = $ptButtons.find(ptButtonSelector);

    if (draftText.length == 0) {
        requestDefaultEncrypt($ptButtons);
    } else {
        togglePtButton($ptButton, isEncrypted);
    }

    $draftable.removeClass(PRE_DRAFT_CLASS);
}

var DECRYPT_PREVIEWS_ON = true;
$(document).ready(function() {

    // inject javascript into actual page
    if (DECRYPT_PREVIEWS_ON) {
        if (onGmail()) {
            injectJavascriptIntoGmail();
        }
    }

    setTimeout(function() {
        decryptHandler($('body'));
    }, 1000);

    /**** automatically try to decrypt DOM whenever it changes ****************************************************/
    $(document).on('DOMNodeInserted', function(e) {
        decryptHandler($(e.target));
    });


});

function onGmail() {
    var d = document.domain;
    return (d == "mail.google.com");
}

var JQUERY_URL = "https://ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js";
//var JQUERY_URL = "https://parseltongue.s3.amazonaws.com/js/jquery-1.10.2.min.js";
var PT_JAVASCRIPT_URL = "https://parseltongue.s3.amazonaws.com/js/inject_into_gmail.js";
function injectJavascriptIntoGmail() {
    var jq = document.createElement('script');
    jq.src = JQUERY_URL;
    document.getElementsByTagName('body')[0].appendChild(jq);
    var pt_javascript = document.createElement('script');
    pt_javascript.src = PT_JAVASCRIPT_URL;
    document.getElementsByTagName('body')[0].appendChild(pt_javascript);
    // Event listener
    window.addEventListener('message', function(event) {
        if (event.data.type && (event.data.type == "PT_MESSAGE")) {
            var visible_inbox = event.data.visible_inbox;
            decryptPreviews(visible_inbox);
        }
    });
}