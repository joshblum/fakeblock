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

///////////Global vars/////////////
// global website base, set to localhost for testing, use deploy script to change
// var baseUrl = "http://127.0.0.1";
var baseUrl = "http://fakeblock.herokuapp.com";
var SENTINAL = "fakeblock";

/*
    helper to execute messages between content and background script
*/
function executeMessage(request, sender, sendResponse) {
    var msg = JSON.parse(request)
    var action = msg.action;
    var ACTION_MAP = {
        "encrypt" : [encrypt, msg.message, msg.usernames],
        "decrypt" : [decrypt, msg.json],
        "login" : [login, msg.fb_id, msg.fb_handle, msg.auth_token, msg.will_encrypt, sendResponse],
        "encrypt_for" : [encrypt_for, msg.username],
        "get_friends" : [getSingleUsers],
        "will_encrypt" : [setEncrypt, msg.will_encrypt, sendResponse],
    }

    if (action in ACTION_MAP){
        var args = ACTION_MAP[action]; //get mapped function and args
        //apply func with args
        var res = args[0].apply(this, args.slice(1));
        if (args[args.length-1] != sendResponse) {
            sendResponse(JSON.stringify({
                "res" : res,
            }));
        }
    } 
}

function encrypt_for(usernames) {
    var user_meta = loadLocalStore('user_meta');
    user_meta.encrypt_for = usernames;
    writeLocalStorage('user_meta', user_meta);
}

//http://stackoverflow.com/questions/5223/length-of-javascript-object-ie-associative-array
Object.size = function(obj) {
    var size = 0, key;
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

//writes to localStorage
function writeLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

//helper function to build a url
//adds the auth_token to every request
function buildUrl(path, getParam) {
    getParam = getParam || {}
    var user_meta = loadLocalStore('user_meta');
    if (!Object.size(user_meta)){
        return ""
    }
    var url =  baseUrl + path + "?auth_token=" + user_meta.auth_token;
    if (getParam === {}) {
        return url
    }
    $.each(getParam, function(key, val){
        url += "&" + key + "=" + val
    });
    return url
}
