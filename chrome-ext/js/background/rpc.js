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
        "writeUserMeta": [writeUserMeta, msg.userMeta]
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

function getDefaultEncrypt() {
    var userMeta = loadLocalStore('userMeta');
    return userMeta.defaultEncrypt;
}

function getUserMeta() {
    var userMeta = loadLocalStore("userMeta");
    delete userMeta.pri_key;
    return userMeta;
}

function writeUserMeta(userMeta) {
    writeLocalStorage("userMeta", userMeta);
}