//attaches event listeners and handles passing messages

$(document).ready(function() {
});


/****** stuff for finding fakeblocks and parsing them *****************************************************************/


// selects all divs that contain text with fakeblock.. and do not have any children
function getDivsContainingFakeBlock() {
    return $(":contains('=fakeblock='):not(:has(*))");
}

// returns array of match objects,
// match_object[0] = whole match
// match_object[1] = json
// returns empty array if there were no matches
function getFakeBlocksFromText(text) {
    var to_return = [];
    var myRe = new RegExp("=fakeblock=(.*)=endfakeblock=", "g");
    var result = myRe.exec(text);
    to_return.push(result);
    while (result!=null) {
        result = myRe.exec(text);
        if (result) {
            to_return.push(result);
        }
    }
    return to_return;
}

// get all fakeblock objects from whole page
function getFakeblocksFromPage() {
    var divs = getDivsContainingFakeBlock();
    var all_fakeblocks = [];
    divs.each(function() {
        var match_objects = getFakeBlocksFromText($(this).text());
        match_objects.each(function() {
            var whole_match = $(this)[0];
            var parsed_json = $.parseJSON($(this)[1]);
            var fakeblock_obj = {
                'whole_match':whole_match,
                'parsed_json':parsed_json
            };
            all_fakeblocks.push(fakeblock_obj);
        });
    });
    return all_fakeblocks;
}
