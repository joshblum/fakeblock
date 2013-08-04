function sendMessage(dict, callback) {
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
        to_return += ".";
    }
    return to_return;
}