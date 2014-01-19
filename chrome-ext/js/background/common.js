/*
    userMeta ::=
     {
     "pri_key": "",
     "username": ""
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
var baseUrl = "http://127.0.0.1:8000";
// var baseUrl = "http://www.parseltongueextension.com";
var SENTINAL = "fakeblock";
var userMeta = loadLocalStore("userMeta");

/*
    helper to execute messages between content and background script
*/
function executeMessage(request, sender, sendResponse) {
    var msg = JSON.parse(request);
    var action = msg.action;
    var ACTION_MAP = {
        "encrypt": [encrypt, msg.message, msg.usernames],
        "canEncryptFor": [canEncryptFor, msg.usernames],
        "decrypt": [decrypt, msg.json],
        "userInitialize": [userInitialize, msg.username, msg.password],
        "uploadUserData": [uploadUserData],
        "getPriKeyFromServer": [getPriKeyFromServer],
        "parseltongueLogout": [parseltongueLogout],
        "getUserMeta": [getUserMeta],
        "refreshLocalStorage": [refreshLocalStorage, msg.username, msg.password, msg.encrypted_pri_key],
    };

    if (action in ACTION_MAP) {
        var args = ACTION_MAP[action]; //get mapped function and args
        //apply func with args
        var res = args[0].apply(this, args.slice(1));
        if (args[args.length - 1] != sendResponse) {
            sendResponse(JSON.stringify({
                "res": res,
            }));
        }
    }
}

function getEncryptFor() {
    var userMeta = loadLocalStore('userMeta');
    return userMeta.encrypt_for
}

function getWillEncrypt() {
    var userMeta = loadLocalStore('userMeta');
    return userMeta.will_encrypt
}

function encryptFor(usernames) {
    var userMeta = loadLocalStore('userMeta');
    userMeta.encrypt_for = usernames;
    writeLocalStorage('userMeta', userMeta);
}

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
    localStorage.setItem(key, JSON.stringify(value));
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

function getUserMeta() {
    return loadLocalStore("userMeta");
}

function normalizeEmail(email) {
    return email.toLowerCase();
}