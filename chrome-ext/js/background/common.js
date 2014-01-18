//global variables and helper functions

//localStorage datastructures
//fakeblock ::=
//{
//  "users:" {
//      "username" : {
//              //used to verify decryption possible
//              e_sentinals : [,,,], 
//              e_shared_secrets : [,,,],
//      },
//      ...
//  },
//  "cipher_text" : "",
// }

//user_meta ::= 
// {
//  "pub_key" : "",
//  "priv_key" : "",
//  "username" : "",
//  "encrypt_for" : "",
//  "auth_token" : "",
// }

// user_map ::=
// {
//     "username" :  {
//         "pub_keys" : [,,,],
//         "fb_handle" : "",
//         "fb_id" : "",
//         "name" : "",
//     },
//     ...
// }

// group_map ::= 
// {
//     "group_id" : {
//         "usernames" : [,,,],
//         "shared_secret" : "",
//     },
//     ...
// }


///////////////////////////// NEW localStorage datastructures
//user_meta ::=
// {
// "pri_key": "",
// "username": ""
// }
//
// registration ::=
//{
//    "pub_key": "",
//    "pri_key": "",
//    "encrypted_pri_key": "",
//    "completed": bool
//}

///////////Global vars/////////////
// global website base, set to localhost for testing, use deploy script to change
var baseUrl = "http://127.0.0.1:8000";
//var baseUrl = "http://fakeblock.herokuapp.com";
var SENTINAL = "fakeblock";

/*
    helper to execute messages between content and background script
*/
function executeMessage(request, sender, sendResponse) {
    var msg = JSON.parse(request);
    var action = msg.action;
    var ACTION_MAP = {
        "encrypt": [encrypt, msg.message, msg.usernames, msg.which_network],
        "can_encrypt_for": [canEncryptFor, msg.usernames, msg.which_network],
        "decrypt": [decrypt, msg.json],
        "user_initialize": [userInitialize, msg.username, msg.password],
        "upload_user_data": [uploadUserData],
        "getPriKeyFromServer": [getPriKeyFromServer],
        "recoverPriKey": [recoverPriKey, msg.encrypted_pri_key, msg.password],
        "parseltongueLogout": [parseltongueLogout]
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
    var user_meta = loadLocalStore('user_meta');
    return user_meta.encrypt_for
}

function getWillEncrypt() {
    var user_meta = loadLocalStore('user_meta');
    return user_meta.will_encrypt
}

function encryptFor(usernames) {
    var user_meta = loadLocalStore('user_meta');
    user_meta.encrypt_for = usernames;
    writeLocalStorage('user_meta', user_meta);
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

//returns a JSON object of the key or empty dict
function loadLocalStore(key) {
    var localString = localStorage.getItem(key);
    // catch undefined case
    localString = (localString) ? localString : "{}";
    return JSON.parse(localString);
}

//writes to localStorage... value is a dictionary
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

//helper function to build a url
//adds the auth_token to every request
function buildUrl(path, getParam) {
    getParam = getParam || {};
    var user_meta = loadLocalStore('user_meta');
    var url = baseUrl + path;
    if (!Object.size(user_meta)) {
        return url
    }
    url = url + "?auth_token=" + user_meta.auth_token;
    if (getParam === {}) {
        return url
    }
    $.each(getParam, function(key, val) {
        url += "&" + key + "=" + val
    });
    return url
}