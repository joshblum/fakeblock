function loginPrompt() {
    sendMessage({
        "action": "getUserMeta",
    }, function(res) {
        userMeta = JSON.parse(res).res;
        if (isGmailPage() && !isLoggedIn(userMeta) && !userMeta.ignoreLoginPrompt) {
            setupPrompt();
        }
    });
}

/*
    Call the parseltongue server to get an iframe with a prompt
*/
function setupPrompt(baseUrl) {
    // debugger
    if ($("#pt-frame").length) {
        $("#pt-frame").css("z-index", 999999999);
        return;
    }
    var size = 350;
    var height = 200;
    var baseUrl = "https://getparseltongue.com"
    var settings = {
        "z-index": 999999999,
        "border-style": "none",
        "width": size,
        "height": height,
        "position": "fixed",
        "right": "0px",
        "top": "0px",
    };
    var ptFrame = $("<iframe>").css(settings).attr("id", "pt-frame").attr("src", baseUrl + "/ext/login");

    $("body").append(ptFrame);

    window.addEventListener("message", function(e) {
        if (e.origin === baseUrl) {
            var msg = JSON.parse(e.data);
            if (msg.action === "fade") {
                $("#pt-frame").remove()
            } else {
                chrome.extension.sendMessage(JSON.stringify(msg));
            }
        }
    }, false);
}

function isGmailPage() {
    return window.location.host === "mail.google.com";
}