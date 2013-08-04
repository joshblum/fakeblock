$(document).ready(function(){
    if (document.domain === "facebook.com"){
        return
    }
    var $plugin_token = $("#plugin-token");
    var auth_token = $plugin_token.data("auth_token");
    var fb_id = $plugin_token.data("fb_id");
    var fb_handle = $plugin_token.data("fb_handle");
    if (auth_token != ""){
        console.log(auth_token)
        sendMessage({
            "action" : "login",
            "auth_token" : auth_token,
            "fb_id" : fb_id,
            "fb_handle" : fb_handle,
        }, function(res){});
    }

});