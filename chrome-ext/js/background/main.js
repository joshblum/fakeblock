//handles passing messages to content_scripts
//calling backend functions

function messageListener() {
    chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
        executeMessage(request, sender, sendResponse);
        return true;
    });
}

$(document).ready(function() {
    syncFriends()
    messageListener();
});
