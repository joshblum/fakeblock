$(document).ready(function(){
    if (document.domain === "facebook.com"){
        return
    }

    token = $("#plugin-token").val();
    if (token != ""){
        console.log(token)
        sendMessage({
            "action" : "set_auth_token",
            "token" : token,
        });
    }

});