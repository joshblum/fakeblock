var DRAFT_SEPARATOR_REGEX = '(' + DRAFT_SEPARATOR + ')?';
var PT_HTML_REGEX = new RegExp(FAKEBLOCK_OPEN_TAG.split('').join(DRAFT_SEPARATOR_REGEX).split('|').join('\\|') +
    '(.*)' +
    FAKEBLOCK_CLOSE_TAG.split('').join(DRAFT_SEPARATOR_REGEX).split('|').join('\\|'),
    'g'
);
var PT_TEXT_REGEX = new RegExp(FAKEBLOCK_OPEN_TAG.split('|').join('\\|') +
    '(.*)' +
    FAKEBLOCK_CLOSE_TAG.split('|').join('\\|')
);
//attaches event listeners and handles passing messages

jQuery.fn.justtext = function() {
    /* http://stackoverflow.com/questions/11362085/jquery-get-text-for-element-without-children-text */
    return $(this).clone()
            .children()
            .remove()
            .end()
            .text();

};

$(document).ready(function() {
    setTimeout(function() {
        decryptHandler($('body'));
    }, 1000);
    
    /**** automatically try to decrypt DOM whenever it changes ****************************************************/
    $(document).on('DOMNodeInserted', function(e) {
        decryptHandler($(e.target));
    });

});

/****** stuff for finding fakeblocks and parsing them *****************************************************************/

function getDivsContainingFakeBlock($container) {
    /* 
    get divs that are all of the following:
        -immediate parent of a fakeblock to be decrypted
        -not in a div where the draft is still being loaded
        -not in the unencrypted textarea overlay
    */
    return $container.find('div').add($container).filter(function(i, elm) {
        var isEncrypted = PT_HTML_REGEX.test($(elm).justtext());

        return isEncrypted &&
            $(elm).closest(getSelectorForClass(FAKEBLOCK_TEXTAREA_CLASS)).length == 0;
    });
}

function getHtmlToReplace($encryptedElm) {
    /*
    returns an array of the encrypted parts of the html in $encryptedElm
    */
    var all_html = $encryptedElm.html();
    var to_return = [];
    var result = PT_HTML_REGEX.exec(all_html);

    while (result != null) {
        to_return.push(result[0]);
        result = PT_HTML_REGEX.exec(all_html);
    }

    return to_return; 
}

function getEncryptedText(html) {
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

function getEncryptedJson(encryptedText) {
    /*
    given an encryped parseltongue block of text
    return the json holding the ciphertext, etc.
    */
    var match = PT_TEXT_REGEX.exec(encryptedText);
    if (! match) {
        return null;
    }
    var byte_str = match[1];
    var json = decodeByteString(byte_str);
    return $.parseJSON(json);
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

function decryptElements($encryptedElms) {
    var decryptDict = {};
    $.each($encryptedElms, function(i, elm){
        var htmlsToReplace = getHtmlToReplace($(elm));
        // TODO: if htmlsToReplace's first element isn't same as beginning substring of a draft element,
        // then have to call decryptDraft, false 
        var encryptedTexts = htmlsToReplace.map(function(html) {
            return getEncryptedText(html);
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

function decryptEncryptedHtml($encryptedElm, htmlToReplace, encryptedText) {
    /*
    given a DOM element with encrypted content, the encrypted html content to replace, 
    and the text of the encrypted html, send a message to decrypt the encrypted text
    and replace the encrypted html of the element if successful
    */
    sendMessage({
        'action' : 'decrypt',
        'json' : encryptedText,
    }, function(response) {
        var decryptedText = $.parseJSON(response).res;
        if (decryptedText == null) {
            decryptDraft($encryptedElm, false);
            return;
        }
        var all_html = $encryptedElm.html();
        all_html = all_html.replace(htmlToReplace, decryptedText);
        $encryptedElm.html(all_html);

        decryptDraft($encryptedElm, true);
    })
}

function decryptDraft($draftable, wasEncrypted) {
    if (! $draftable.hasClass('pre-draft')) {
        return;
    }

    var ptButtonSelector = wasEncrypted ? '.pt-unlocked' : '.pt-locked';
    var $ptButton = getPtButtonsFor($draftable).find(ptButtonSelector);
    togglePtButton($ptButton, wasEncrypted); 

    $draftable.removeClass('pre-draft');
}
