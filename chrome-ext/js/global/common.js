//http://stackoverflow.com/questions/5223/length-of-javascript-object-ie-associative-array
Object.size = function(obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function isLoggedIn(userMeta) {
    return 'username' in userMeta;
}

function logErrorToServer(error_message) {
    var post_data = {
        "error": error_message
    };
    $.post("/error/", post_data, function(data) {});
}
