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
    postInstall();
    messageListener();
});

// reload gmail tabs
function reloadGmailTabs() {
    chrome.tabs.query({
        url: "https://mail.google.com/*"
    }, function(tabs) {
        $.each(tabs, function(i, e) {
            var tab_id = e.id;
            chrome.tabs.reload(tab_id, {
                bypassCache: true
            }, function() {
                console.log(tab_id);
            });
        });
    });
}

function postInstall() {
    if (!localStorage.first) {
        var register_url = baseUrl + "/register/";
        chrome.tabs.create({
            url: register_url
        });
        reloadGmailTabs();
        localStorage.first = "true";
    }
}