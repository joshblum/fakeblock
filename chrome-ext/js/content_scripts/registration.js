$(document).ready(function()
{
    debugger;
    if (onThisPage("/register/")) {
        $(".register_button").click(function(e) {
            e.preventDefault();
            var email_input = $(".register_email");
            var email_val = email_input.val();
            var password_input1 = $(".register_password1");
            var password = password_input1.val();
            debugger;
            sendMessage({
                "action" : "user_initialize",
                "username": email_val,
                "password" : password
            }, function(response) {
                alert("user initialized!");
                var res = $.parseJSON(response).res;
                // TODO: something about checking if user_initialize worked
                // if it didn't work, registrations really fucked
            });
        });
    }
    else if (onThisPage("/initializing/")) {
            // check if there is a non-completed registration info in
            // local storage, and if there is, upload all the info to
            // the server
            debugger;
            sendMessage({
                "action" : "upload_user_data"
            }, function(response) {
                alert("user data uploaded!");
                // TODO: something about checking if data upload worked
                // if it failed as opposed to just, already had been done
                // we have a problem
                var res = $.parseJSON(response).res;
                window.location.replace("http://mail.google.com");
            });
    }
});

// TODO: make this better.. check domain too
function onThisPage(page) {
    var current_url = window.location.pathname;
    return (current_url == page);
}
