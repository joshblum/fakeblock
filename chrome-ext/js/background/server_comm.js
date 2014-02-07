var URLS = {
    "pub_upload": "/upload_pubkey/",
    "pri_upload": "/upload_prikey/",
    "get_pubkeys": "/get_pubkeys/",
    "get_prikey": "/get_prikey/",
    "extension_sync": "/extension_sync/"
};

function getPubKeysFromServer(usernames) {
    var url = buildUrl(URLS.get_pubkeys);
    var data = {
        "requested_keys": JSON.stringify(usernames),
    };
    var pub_keys;
    $.ajax({
        type: "GET",
        url: url,
        data: data,
        success: function(res) {
            pub_keys = res;
            var cachedUsers = loadLocalStore('cachedUsers');
            for (username in res) {
                var pub_key = res[username];
                if (pub_key) {
                    cachedUsers[username] = res[username];
                }
            }
            writeLocalStorage("cachedUsers", cachedUsers);
        },
        failure: function() {
            var e_message = "JS ERROR: getPubKeysFromServer ";
            logErrorToServer(e_message);
            return false;
        },
        async: false
    });
    return pub_keys
}

function refreshLocalStorage(username, password, encrypted_pri_key) {
    var cachedUsers = getCachedUsers([username]);
    var pub_key = cachedUsers[username];
    var userMeta = createUserMeta(username, pub_key, recoverPriKey(encrypted_pri_key, password));
    writeLocalStorage("userMeta", userMeta);
}

function recoverPriKey(encrypted_pri_key, password) {
    return JSON.parse(decryptAES(encrypted_pri_key, password));
}

function getPriKeyFromServer() {
    var url = buildUrl(URLS.get_prikey);
    var pri_key;
    $.ajax({
        type: "GET",
        url: url,
        success: function(res) {
            pri_key = res.pri_key;
        },
        failure: function() {
            var e_message = "JS ERROR: getPriKeyFromServer ";
            logErrorToServer(e_message);
            return false;
        },
        async: false
    });
    return pri_key
}

function uploadPubKey(username, pub_key) {
    var url = buildUrl(URLS.pub_upload);
    $.ajax({
        type: "POST",
        url: url,
        data: {
            "username": username,
            "pub_key": pub_key
        },
        success: function(res) {
            return true;
        },
        failure: function() {
            var e_message = "JS ERROR: uploadPubKey | " + username;
            logErrorToServer(e_message);
            return false;
        },
        async: false
    });
}

function uploadPriKey(username, pri_key) {
    var url = buildUrl(URLS.pri_upload);
    $.ajax({
        type: "POST",
        url: url,
        data: {
            "username": username,
            "pri_key": pri_key
        },
        success: function(res) {
            return true;
        },
        failure: function() {
            var e_message = "JS ERROR: uploadPriKey | " + username;
            logErrorToServer(e_message);
            return false;
        },
        async: false
    });
}

function pullServerMessages() {
    /*
    checks our server for messages for actions to complete
    */
    var appDetails = chrome.app.getDetails();
    if (! ('version' in appDetails)) {
        return;
    }
    var version = appDetails['version'];
    var url = buildUrl(URLS.extension_sync);
    $.ajax({
        type: "POST",
        url: url,
        data: {
            'version' : version,
        },
        success: function(res) {
            try {
                var messages = res.messages;
                $.each(messages, function(i, message) {
                    executeServerMessage(message);
                });
            } catch (err) {
                logErrorToServer("Error executing server command during pullServerMessages" + err);
            }
        },
        failure: function() {
            logErrorToServer("JS ERROR: extensionSync | " + username);
            return false;
        }
    });
}

function executeServerMessage(message) {
    /*
    takes a particular message from the server and runs the appropriate code
    */
    if (message in serverMessages) {
        serverMessages[message]();
    }
}

/*
Server message methods
-clearCache - clear all users' pub keys from cache
-refreshPubKey - get own pub key from cache or server
*/
var serverMessages = {
    'clearCache' : clearCache,
    'refreshPubKey' : refreshPubKey,
};

function clearCache() {
    writeLocalStorage("cachedUsers", {});
}

function refreshPubKey() {
    var userMeta = getUserMeta();
    var cachedUsers = getCachedUsers([username]);
    var pub_key = cachedUsers[username];
    userMeta['pub_key'] = pub_key;
    writeLocalStorage('userMeta', userMeta);
}