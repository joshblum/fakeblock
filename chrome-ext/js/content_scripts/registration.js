$(document).ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
});


$(document).ready(function()
{
    // debugger;
    if (onThisPage("/register/")) {

        $(".register_button").click(function(e) {
            e.preventDefault();
            var form_wrapper = $(".register_form");
            var error_div = $(".register_error");
            var loading_gif = $(".loading-gif");
            error_div.hide();
            loading_gif.fadeIn();
            setTimeout(function(){
                var password_input1 = $(".register_password1");
                var password_input2 = $(".register_password2");
                var password1 = password_input1.val();
                var password2 = password_input2.val();
                var email_input = $(".register_email");
                var email_val = email_input.val();
                var post_data = {
                    "email":email_val,
                    "password1":password1,
                    "password2":password2
                };
                $.post("/register/", post_data, function(data) {
                    loading_gif.hide();
                    var error = data['error'];
                    var message = data['message'];
                    if (error == '') {
                        // generate public and private key and store in local storage, and send confirmation email
                        var redirect_url = "/welcome/" + email_val + "/";
                        initializeUser(email_val, password1, redirect_url);
                        // after confirmation email
                        // upload public key
                        // upload encrypted version of private key
                        // redirect to gmail
                    }
                    else {
                        error_div.show();
                        error_div.html(error);
                    }
                });
            },200);
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
    else if (onThisPage("/login/")) {
        // login button functionality
        debugger
        $(".login_button").click(function(e) {
            e.preventDefault();
            var error_div = $(".login_error");
            var loading_gif = $(".loading-gif");
            error_div.hide();
            loading_gif.fadeIn();
            var password_input = $(".login_password");
            var password = password_input.val();
            var login_email_input = $(".login_email");
            var email_val = login_email_input.val();
            var post_data = {
                "email":email_val,
                "password":password
            };
            debugger
            $.post("/login/", post_data, function(data) {
                debugger;
                loading_gif.hide();
                var error = data['error'];
                var message = data['message'];
                if (error == '') {
                    // post successful login
                    // .. try to pull private key from server
                    var encrypted_private_key = getEncryptedPrivateKey();
                    // .. if no private key found, generate keys and redirect to initialize
                    if (encrypted_private_key == null) {
                        debugger;
                        initializeUser(email_val, password, "/initializing/");
                    }
                    // else a private key was found, so write it to local storage, and redirect to gmail
                    else {
                        savePrivateKey(encrypted_private_key);
                        redirectToGmail();
                    }
                }
                else {
                    error_div.show();
                    error_div.html(error);
                }
            });
        });
    }
});

function initializeUser(email, password, redirect_url) {
    sendMessage({
        "action" : "user_initialize",
        "username": email,
        "password" : password
    }, function(response) {
        alert("user initialized!");
        window.location.href = redirect_url;
        var res = $.parseJSON(response).res;
        // TODO: something about checking if user_initialize worked
        // if it didn't work, registrations really fucked
    });
}

function redirectToGmail() {
    window.location.replace("http://mail.google.com");
}

function getEncryptedPrivateKey() {
    return null;
}

function savePrivateKey(encrypted_private_key) {
    alert("to do");
}

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// TODO: make this better.. check domain too
function onThisPage(page) {
    var current_url = window.location.pathname;
    return (current_url == page);
}
