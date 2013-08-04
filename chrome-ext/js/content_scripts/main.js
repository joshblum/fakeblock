//attaches event listeners and handles passing messages

// $(document).ready(function() {
//     // decryptFakeblocks();

//     // ***** automatically try to decrypt DOM whenever it changes *****************************************************
//     // var intervalID = setInterval(function(){
//     //     decryptFakeblocks();
//     // },5000);

// //    $(document).bind('DOMNodeInserted', function(e) {
// //        decryptFakeblocks();
// //    });
// //
// //    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
// //
// //    var observer = new MutationObserver(function(mutations, observer) {
// //        // fired when a mutation occurs
// //        decryptFakeblocks();
// //    });
// //
// //// define what element should be observed by the observer
// //// and what types of mutations trigger the callback
// //    observer.observe(document, {
// //        subtree: true,
// //        attributes: false
// //    });
// });

/****** stuff for finding fakeblocks and parsing them *****************************************************************/

// selects all divs that contain text with fakeblock.. and do not have any children
function getDivsContainingFakeBlock() {
//    var divs = $("p:contains('|fakeblock|'):not(:has(*))").not("script");
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
    var divs = getDivsContainingFakeBlock();
    var all_fakeblocks = [];
    divs.each(function() {
        var div = $(this);
        var match_objects = getFakeBlocksFromText(div.text());
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

// decrypt and replace all faceblocks for a user
function decryptFakeblocks() {
    var fakeblocks = getFakeblockObjectsFromPage();
    $.each(fakeblocks, function() {
        var fakeblock = $(this)[0];
        var to_replace = fakeblock['whole_match'];
        var unparsed_json = fakeblock['unparsed_json'];
        var parsed_json = fakeblock['parsed_json'];
        // send to back to decrypt and replace to_replace with decrypted_text
        replaceFakeblockWithDecryptedText(to_replace, parsed_json);
    });
}

// backend decrypts fakeblock unparsed_json into decrypted_text
function replaceFakeblockWithDecryptedText(to_replace, json) {
    console.log("sent");
    sendMessage({
        "action" : "decrypt",
        "json" : json
    }, function(response) {
        debugger
        var decrypted_text = $.parseJSON(response).res;
        if (decrypted_text != "") {
            var all_html = $("body").html();
            var new_html = all_html.replace(to_replace, decrypted_text);
            $("body").html(new_html);
        }
    });
}




