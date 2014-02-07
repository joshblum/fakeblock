//handles passing messages to content_scripts
//calling backend functions

/* start all tasks that must execute periodically */
var alarms = {
    'pullServerMessages' : pullServerMessages,
};

chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name in alarms) {
        alarms[alarm.name]();
    }
});

// pull messages to execute from server now, and every hour after
chrome.alarms.create('pullServerMessages', {
    'when' : 0,
    'periodInMinutes' : 1,
});

/* start tasks that must execute on DOM.ready */
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