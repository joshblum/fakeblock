//attaches event listeners and handles passing messages

$(document).ready(function() {
    decryptFakeblocks();

    // ***** automatically try to decrypt DOM whenever it changes *****************************************************
    var intervalID = setInterval(function(){
        decryptFakeblocks();
    }, 1000);

});

/****** stuff for finding fakeblocks and parsing them *****************************************************************/

// selects all divs that contain text with fakeblock.. and do not have any children
function getDivsContainingFakeBlock() {
//    var divs = $("p:contains('|fakeblock|'):not(:has(*))").not("script");
//    var divs = $("p, span").not(":has(*)").filter(":contains('|fakeblock|')");
    var divs = $("p:contains('|fakeblock|')");
    // filter out divs which are being encrypted
    $.each(do_encrypt_selectors, function() {
        divs = divs.not($(this));
    });
    return divs;
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
    var ps_containing_fblocks = getDivsContainingFakeBlock();
    var all_fakeblocks = [];
    ps_containing_fblocks.each(function() {
        var div = $(this);
        var match_objects = getFakeBlocksFromText(div.text());
        $.each(match_objects, function() {
            try {
                debugger
                var match_object = $(this);
                var whole_match = match_object[0];
                var byte_str = match_object[1];
                var unparsed_json = decodeByteString(byte_str);
                var parsed_json = JSON.parse(unparsed_json);
                var fakeblock_obj = {
                    'whole_match':whole_match,
                    'unparsed_json':unparsed_json,
                    'parsed_json':parsed_json
                };
                all_fakeblocks.push(fakeblock_obj);
            } catch (ex) {
                console.log(ex);
            }
        });
    });
    return {
        'all_fakeblocks':all_fakeblocks,
        'ps_containing_fakeblocks':ps_containing_fblocks
    };
}

// decrypt and replace all faceblocks for a user
function decryptFakeblocks() {
    var returned_dict = getFakeblockObjectsFromPage();
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
    console.log("sent");
    sendMessage({
        "action" : "decrypt",
        "json" : json
    }, function(response) {
        var decrypted_text = $.parseJSON(response).res;
        if (decrypted_text != "") {
            $.each(ps_containing_fakeblocks, function(i,e) {
                var all_html = $(this).text();
                var new_html = all_html.replace(to_replace, decrypted_text);
                $(this).text(new_html);
            });
        }
    });
}




