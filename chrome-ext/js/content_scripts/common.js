//class to add to the compose email textarea so that it doesn't get decrypted before being sent
var FAKEBLOCK_TEXTAREA_CLASS = 'parseltongue-encrypted';
var NON_FAKEBLOCK_TEXTAREA_CLASS = 'parseltongue-unencrypted';
var FAKEBLOCK_OPEN_TAG = 'Email encrypted by ParselTongue   |begin encrypted email|';
var FAKEBLOCK_CLOSE_TAG = '|end encrypted email|';
var PRE_DRAFT_CLASS = 'pre-draft';
var DRAFT_SEPARATOR = '<wbr>';

function sendMessage(dict, callback) {
    var csrf_token = getCookie('csrftoken');
    dict["csrf_token"] = csrf_token;
    chrome.runtime.sendMessage(JSON.stringify(dict), callback);
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

// byte encoding
function strToByteArray(str) {
    var bytes = [];
    for (var i = 0; i < str.length; ++i) {
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
        if (i < str.length - 1) {
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

Object.size = function(obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function getSelectorForClass(klass) {
    return '.' + klass;
}

function getEmailFromString(str) {
    var re = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
    if (re.test(str)) {
        return re.exec(str)[0];
    }
    return null;
}
