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
    setTip();
    $(".has-switch").tooltip("show");
    sendMessage({
        "action": "writeUserMeta",
        "userMeta": userMeta,
    }, function(res) {});
}

function initToggle() {
    var $defaultEncrypt = $('.default-encrypt');
    $defaultEncrypt.bootstrapSwitch();
    $defaultEncrypt.on('switch-change', toggleSwitch);
    $defaultEncrypt.bootstrapSwitch('setState', userMeta.defaultEncrypt);
    setTip();
}

function setTip() {
    var title;
    title = "Click the snake when composing to encrypt.";
    if (isLoggedIn() && userMeta.defaultEncrypt) {
        title = "Emails to parsletongue users will automatically be encrypted.";
    }
    $(".has-switch").tooltip("destroy").tooltip({
        "placement": "bottom",
        "title": title,
    });
}

$(document).ready(function() {
    sendMessage({
        "action": "getUserMeta",
    }, function(res) {
        userMeta = JSON.parse(res).res;
        renderView();
        initToggle();
    });

    window.backpage = chrome.extension.getBackgroundPage();
    baseUrl = backpage.baseUrl;
    $("a").click(clickHandle);
});