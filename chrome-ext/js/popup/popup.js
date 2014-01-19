$(document).ready(function() {

    $(".parseltongue_logout").click(function(e) {
        e.preventDefault();
        sendMessage({
            "action" : "parseltongueLogout"
        }, function(response) {
            window.location.href = "/logout/";
        });
    });

    $("a").click(function(e) {
        e.preventDefault();
        alert('click');
        var url = $(this).attr('href');
        chrome.tabs.create({url: url});
    });

});