var URLS = {
    "pub_upload": "/upload_pubkey/",
    "pri_upload": "/upload_prikey/",
    "get_pubkeys": "/get_pubkeys/",
    "get_prikey": "/get_prikey/",
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
                if (pub_key.length != 0) {
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
    writeLocalStorage("userMeta", {
        'username': username,
        'pri_key': recoverPriKey(encrypted_pri_key, password),
        'defaultEncrypt': true,
    });
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