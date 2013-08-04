var userInputs = [];

function bindContactClickFunction(div) {
    div.click(function() {
        if ($(this).hasClass("clicked")) {
            $(this).removeClass("clicked");
            $(this).find("input").prop('checked', false);
        }
        else {
            $(this).addClass("clicked");
            $(this).find("input").prop('checked', true);
        }
        sendEncryptFor();
    });
}

function sendWillEncrypt() {
    var will_encrypt = $(".will_encrypt").prop("checked");
    sendMessage({
        "action" : "will_encrypt",
        "will_encrypt" : will_encrypt
    }, function(response) {
    });
}

function sendEncryptFor() {
    var encrypt_for_list = [];
    var selected_contacts = $(".contact.clicked");
    selected_contacts.each(function(index, div) {
        var username = $(div).data("username");
        encrypt_for_list.push(username);
    });
    sendMessage({
        "action" : "encrypt_for",
        "usernames" : encrypt_for_list
    }, function(response) {
    });
}

function getEncryptFor() {
    sendMessage({
        "action" : "get_encrypt_for",
    }, function(res){
        $.each($(".contact"), function (i, el){
            $(el).prop('checked', false);
        });
        res = JSON.parse(res)
        $.each(res.res, function(i, user){
            $("#" + user).prop('checked', true);
        });
    });
}

function getWillEncrypt() {
    sendMessage({
        "action" : "get_will_encrypt",
    }, function(res){
        $(".will_encrypt").prop('checked', JSON.parse(res));
    });
}

$(function() {
    sendMessage({
        "action" : "get_friends",
    }, function(response) {
        friends = $.parseJSON(response).res;
        $.each(friends, function(index, friendObj) {
            var username = Object.keys(friendObj)[0];

            var userInput = $('<div class="contact">'+
                '<input id="'+username+'"class="select-contact" type="checkbox"/>'+
                '<div class="contact-name">'+
                friendObj[username] +
                '</div>' +
                '</div>');
            console.log(userInput)
            userInput.data('username', username);
            userInput.data('fullname', friendObj[username]);
            userInputs.push(userInput);
        });
        $.each(userInputs, function(index, div) {
            $(".contacts").append(div);
            bindContactClickFunction(div);
        });

    });
    getWillEncrypt();
    getEncryptFor();
    $(".will_encrypt").click(function() {
        sendWillEncrypt();
    });
    $(".contact").click(function(){
        sendEncryptFor();
    })
});
	
