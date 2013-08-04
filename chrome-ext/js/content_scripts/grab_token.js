$(document).ready(function(){
    if (document.location.pathname !== "/done_token/"){
        return
    }
    var $plugin_token = $("#plugin-token");
    var auth_token = $plugin_token.data("auth_token");
    var fb_id = $plugin_token.data("fb_id");
    var fb_handle = $plugin_token.data("fb_handle");
    var will_encrypt = $plugin_token.data("will_encrypt");
    if (auth_token !== "") {
        console.log(auth_token)
        sendMessage({
            "action" : "login",
            "auth_token" : auth_token,
            "fb_id" : fb_id,
            "fb_handle" : fb_handle,
            "will_encrypt" : will_encrypt,
        }, function(res){});
    }

});