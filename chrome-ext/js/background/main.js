//handles passing messages to content_scripts
//calling backend functions

function messageListener() {
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		executeMessage(request, sender, sendResponse);
		return true
	});
}

$(document).ready(function() {

    // redirect to register after install
    if(!localStorage.first){
        var register_url = "http://www.parseltongueextension.com/register/";
//        window.location.replace(register_url);
        chrome.tabs.create({
           url : register_url
        });
        localStorage.first = "true";
    }

	messageListener();
});