//attaches event listeners and handles passing messages

$(document).ready(function() {
    setTimeout(function() {
        decryptFakeblocks($('body'));
    }, 1000);
    
    /**** automatically try to decrypt DOM whenever it changes ****************************************************/
    $(document).on('DOMNodeInserted', function(e) {
        decryptFakeblocks($(e.target));
    });

});

/****** stuff for finding fakeblocks and parsing them *****************************************************************/

//get immediate parents of a fakeblock
function getDivsContainingFakeBlock($container) {

    return $container.find('div').add($container).filter(
        ':contains("' + FAKEBLOCK_OPEN_TAG + '")' +
        ':contains("' + FAKEBLOCK_CLOSE_TAG + '")'
        ).filter(function(i, elm) {
            return $(elm).find(':contains("' + FAKEBLOCK_OPEN_TAG + '")').length == 0 &&
                $(elm).find(':contains("' + FAKEBLOCK_CLOSE_TAG + '")').length == 0 && 
                ! $(elm).hasClass(FAKEBLOCK_TEXTAREA_CLASS) && 
                ! $(elm).closest(FAKEBLOCK_TEXTAREA_SELECTOR).length > 0;
    });
}

// returns array of match objects,
// match_object[0] = whole match
// match_object[1] = json
// returns empty array if there were no matches
function getFakeBlocksFromText(text) {
    var to_return = [];
    var myRe = new RegExp(FAKEBLOCK_OPEN_TAG.split('|').join('\\|') +
        "(.*)" +
        FAKEBLOCK_CLOSE_TAG.split('|').join('\\|'),
        "g"
    );
    var result = myRe.exec(text);
    while (result != null) {
        to_return.push(result);
        result = myRe.exec(text);
    }
    return to_return;
}

// get all fakeblock objects from whole page
function getFakeblockObjectsFromContainer($container) {
    var ps_containing_fblocks = getDivsContainingFakeBlock($container);
    if (ps_containing_fblocks.length == 0) {
        return null;
    }
    var all_fakeblocks = [];
    ps_containing_fblocks.each(function() {
        var div = $(this);
        var match_objects = getFakeBlocksFromText(div.text());
        $.each(match_objects, function() {
            try {
                var match_object = $(this);
                var whole_match = match_object[0];
                var byte_str = match_object[1];
                var unparsed_json = decodeByteString(byte_str);
                var parsed_json = JSON.parse(unparsed_json);
                var fakeblock_obj = {
                    'whole_match': whole_match,
                    'unparsed_json': unparsed_json,
                    'parsed_json': parsed_json
                };
                all_fakeblocks.push(fakeblock_obj);
            } catch (ex) {
                console.log(ex);
            }
        });
    });
    return {
        'all_fakeblocks': all_fakeblocks,
        'ps_containing_fakeblocks': ps_containing_fblocks
    };
}

// decrypt and replace all faceblocks for a user
function decryptFakeblocks($container) {
    var returned_dict = getFakeblockObjectsFromContainer($container);
    if (returned_dict === null) {
        return;
    }
    var fakeblocks = returned_dict['all_fakeblocks'];
    var ps_containing_fakeblocks = returned_dict['ps_containing_fakeblocks'];
    $.each(fakeblocks, function() {
        var fakeblock = $(this)[0];
        var to_replace = fakeblock['whole_match'];
        var unparsed_json = fakeblock['unparsed_json'];
        var parsed_json = fakeblock['parsed_json'];
        // send to back to decrypt and replace to_replace with decrypted_text
        replaceFakeblockWithDecryptedText(ps_containing_fakeblocks, to_replace, parsed_json);
    });
}

// backend decrypts fakeblock unparsed_json into decrypted_text
function replaceFakeblockWithDecryptedText(ps_containing_fakeblocks, to_replace, json) {
    sendMessage({
        "action": "decrypt",
        "json": json
    }, function(response) {
        var decrypted_text = $.parseJSON(response).res;
        if (decrypted_text != null) {
            $.each(ps_containing_fakeblocks, function(i, e) {
                $(this).html(decrypted_text);
                // if the newly decrypted text was in an unencrypted area, 
                // make sure encrypted area is updated
                var $unencryptedArea = $(this).closest('.parseltongue-unencrypted');
                if ($unencryptedArea.length > 0) {
                    encryptHandler($unencryptedArea);
                }
            });
        }
    });
}