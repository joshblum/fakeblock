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
        "getUserMeta": [getUserMeta, true], //remove pri_key
        "refreshLocalStorage": [refreshLocalStorage, msg.username, msg.password, msg.encrypted_pri_key],
        "setDefaultEncrypt": [setDefaultEncrypt, msg.defaultEncrypt]
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


function getUserMeta(remove_pri) {
    var remove_pri = typeof remove_pri !== 'undefined' ? remove_pri : false;
    var userMeta = loadLocalStore("userMeta");

    if (remove_pri === true) {
        delete userMeta.pri_key;    
    }

    return userMeta;
}

function getDefaultEncrypt() {
    var userMeta = getUserMeta();
    return userMeta.defaultEncrypt;
}

function setDefaultEncrypt(defaultEncrypt) {
    var userMeta = getUserMeta();
    userMeta.defaultEncrypt = defaultEncrypt;
    writeLocalStorage("userMeta", userMeta);
}