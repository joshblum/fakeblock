//attaches event listeners and handles passing messages

$(document).ready(function() {
    decryptFakeblocksForUser('alfred');
});


/****** stuff for finding fakeblocks and parsing them *****************************************************************/

// selects all divs that contain text with fakeblock.. and do not have any children
function getDivsContainingFakeBlock() {
    return $(":contains('|fakeblock|'):not(:has(*))");
}


// returns array of match objects,
// match_object[0] = whole match
// match_object[1] = json
// returns empty array if there were no matches
function getFakeBlocksFromText(text) {
    var to_return = [];
    var myRe = new RegExp("\\|fakeblock\\|(.*)\\|endfakeblock\\|", "g");
    var result = myRe.exec(text);
    while (result!=null) {
        to_return.push(result);
        result = myRe.exec(text);
    }
    return to_return;
}

// get all fakeblock objects from whole page
function getFakeblockObjectsFromPage() {
    var divs = getDivsContainingFakeBlock();
    var all_fakeblocks = [];
    divs.each(function() {
        var match_objects = getFakeBlocksFromText($(this).text());
        $.each(match_objects, function() {
            try {
                var match_object = $(this);
                var whole_match = match_object[0];
                var unparsed_json = match_object[1];
                var parsed_json = $.parseJSON(unparsed_json);
                var fakeblock_obj = {
                    'whole_match':whole_match,
                    'unparsed_json':unparsed_json,
                    'parsed_json':parsed_json
                };
                all_fakeblocks.push(fakeblock_obj);
            } catch (ex) {

            }
        });
    });
    return all_fakeblocks;
}

// get all fakeblocks which can be decrypted by username
function getFakeblockObjectsForUser(username) {
    var all_fakeblocks = getFakeblockObjectsFromPage();
    var user_faceblocks = [];
    $.each(all_fakeblocks, function() {
        var fakeblock = $(this)[0];
        var json = fakeblock['parsed_json'];
        var users = json['users'];
        if (username in users) {
            user_faceblocks.push(fakeblock);
        }
    });
    return user_faceblocks;
}


// decrypt and replace all faceblocks for a user
function decryptFakeblocksForUser(username) {
    var user_fakeblocks = getFakeblockObjectsForUser(username);
    $.each(user_fakeblocks, function() {
        var fakeblock = $(this)[0];
        var to_replace = fakeblock['whole_match'];
        var unparsed_json = jakeblock['unparsed_json'];
        // send to back to decrypt and replace to_replace with decrypted_text
        decrypt(to_replace, unparsed_json);
    });
}

// backend decrypts fakeblock unparsed_json into decrypted_text
function decrypt(to_replace, json) {
    chrome.runtime.sendMessage({
        "action" : "decrypt",
        "json" : json
    }, function(decrypted_text) {
        var all_html = $("body").html();
        var new_html = all_html.replace(to_replace, decrypted_text);
        $("body").html(new_html);
    });
}




