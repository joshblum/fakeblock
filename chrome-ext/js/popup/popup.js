function clickHandle(e) {
    e.preventDefault();
    var url = $(e.target).data("href");
    if (url.indexOf("logout") !== -1) {
        logout();
    }
    backpage.openLink(baseUrl + url);
}

function logout() {
    sendMessage({
        "action": "parseltongueLogout",
    }, function(response) {});
}

function renderView() {
    var $loggedIn = $(".logged-in");
    var $loggedOut = $(".logged-out");
    if (isLoggedIn()) {
        $loggedIn.show();
        $loggedOut.hide();
        $(".user-name").text(userMeta.username);
    } else {
        $loggedOut.show();
        $loggedIn.hide();
    }
}

function isLoggedIn() {
    return Object.size(userMeta) > 0;
}

function toggleSwitch(e, data) {
    userMeta.defaultEncrypt = $(e.target).prop("checked");
    sendMessage({
        "action": "writeLocalStorage",
        "userMeta": userMeta,
    }, function(res) {
    });
}

$(document).ready(function() {
    sendMessage({
        "action": "getUserMeta",
    }, function(res) {
        userMeta = JSON.parse(res).res;
        renderView();
        $('.default-encrypt').prop("checked", userMeta.defaultEncrypt ? "checked" : "");
    });

    window.backpage = chrome.extension.getBackgroundPage();
    baseUrl = backpage.baseUrl;
    $("a").click(clickHandle);
    $('.default-encrypt').click(toggleSwitch);
});