//handles passing messages to content_scripts
//calling backend functions

function messageListener() {
    chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
        executeMessage(request, sender, sendResponse);
        return true;
    });
}

/*
    helper to execute messages between content and background script
*/
function executeMessage(request, sender, sendResponse) {
    var msg = JSON.parse(request)
    var action = msg.action;
    var ACTION_MAP = {
    	"encrypt" : [encrypt, msg.message, msg.usernames],
    	"decrypt" : [decrypt, msg.json]
    }

    if (action in ACTION_MAP){
        var args = ACTION_MAP[action]; //get mapped function and args

      	var response = args[0].apply(this, args.slice(1)); //apply func with args
      	if (response) {
      		sendResponse(response);
      	}
    } 
}

$(document).ready(function() {
	messageListener();
});
