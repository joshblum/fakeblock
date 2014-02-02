/*
    userMeta ::=
     {
     "pri_key": "",
     "username": ""
     "defaultEncrypt": true,
     }

     registration ::=
    {
        "pub_key": "",
        "pri_key": "",
        "encrypted_pri_key": "",
        "completed": bool
    }
*/

///////////Global vars/////////////
// global website base, set to localhost for testing, use deploy script to change
//var baseUrl = "https://www.getparseltongue.com";
var baseUrl = "https://www.getparseltongue.com";
var SENTINAL = "fakeblock";

//http://stackoverflow.com/questions/5223/length-of-javascript-object-ie-associative-array
Object.size = function(obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/*
    returns a JSON object of the key or empty dict
*/
function loadLocalStore(key) {
    var localString = localStorage.getItem(key);
    // catch undefined case
    localString = (localString) ? localString : "{}";
    return JSON.parse(localString);
}

/*
    writes to localStorage... value is a dictionary
*/
function writeLocalStorage(key, value) {
    var originalDefault = getDefaultEncrypt();
    localStorage.setItem(key, JSON.stringify(value));
    var newDefault = getDefaultEncrypt();
    if (originalDefault != newDefault) {
        sendDefaultEncrypt(newDefault);
    }
}

/*
    Helper to open urls from the extension to the main website
*/
function openLink(url) {
    chrome.tabs.create({
        "url": url
    });
}

/*
    helper function to build a url
    adds the auth_token to every request
*/
function buildUrl(path, getParam) {
    getParam = getParam || {};
    var userMeta = loadLocalStore('userMeta');
    var url = baseUrl + path;
    if (!Object.size(userMeta)) {
        return url
    }
    url = url + "?auth_token=" + userMeta.auth_token;
    if (getParam === {}) {
        return url
    }
    $.each(getParam, function(key, val) {
        url += "&" + key + "=" + val
    });
    return url
}

function normalizeEmail(email) {
    return email.toLowerCase();
}