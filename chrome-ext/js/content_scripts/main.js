//attaches event listeners and handles passing messages

$(document).ready(function() {
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
function getFakeblocksFromPage() {
    var divs = getDivsContainingFakeBlock();
    var all_fakeblocks = [];
    divs.each(function() {
        var match_objects = getFakeBlocksFromText($(this).text());
        $.each(match_objects, function() {
            try {
                var match_object = $(this);
                var whole_match = match_object[0];
                var parsed_json = $.parseJSON(match_object[1]);
                var fakeblock_obj = {
                    'whole_match':whole_match,
                    'parsed_json':parsed_json
                };
                all_fakeblocks.push(fakeblock_obj);
            } catch (ex) {

            }
        });
    });
    return all_fakeblocks;
}
