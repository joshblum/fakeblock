function sendMessage(dict, callback) {
    debugger;
    var csrf_token = getCookie('csrftoken');
    dict["csrf_token"] = csrf_token;
    chrome.runtime.sendMessage(JSON.stringify(dict), callback);
}

// byte encoding
function strToByteArray(str) {
    var bytes = [];
    for (var i = 0; i < str.length; ++i)
    {
        bytes.push(str.charCodeAt(i));
    }
    return bytes;
}
function encodeString(str) {
    var b_array = strToByteArray(str);
    var to_return = "";
    for (var i = 0; i < str.length; i++) {
        var c = String(b_array[i]);
        to_return += c;
        if (i < str.length-1) {
            to_return += "*";
        }
    }
    return to_return;
}

// byte decoding
function byteArrayToString(array) {
    var result = "";
    for (var i = 0; i < array.length; i++) {
        var int = parseInt(array[i]);
        result += String.fromCharCode(int);
    }
    return result;
}

// comma separated byte array
function decodeByteString(csb) {
    var b_array = csb.split("*");
    return byteArrayToString(b_array);
}
