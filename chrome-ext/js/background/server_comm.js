//houses the login and syncFriends functions

var PUB_UPLOAD = "/upload_pubkey/";
var PRI_UPLOAD = "/upload_prikey/";
var GET_PUBKEYS = "/get_pubkeys/";
var GET_PRI_KEY = "/get_prikey/";
var CONNECT = "/connect_with_facebook/";

//creates user_meta storage if it does not exist
//and posts the pub_key to server
function login(fb_id, fb_handle, auth_token, will_encrypt, callback) {
    var user_meta = loadLocalStore('user_meta');
    var username = (fb_handle) ? fb_handle : fb_id;
    var create_new = (!Object.size(user_meta));

    //get latest server vals
    user_meta.auth_token = auth_token;
    user_meta.username = username;
    user_meta.will_encrypt = will_encrypt;
    writeLocalStorage('user_meta', user_meta);

    if (username === null || auth_token === null) return;
    if (create_new) {
        console.log("creating new user");
        _createUserMeta(user_meta);
        _postPubKey(user_meta.pub_key, function(success) {
            if (success) {
                setTimeout(syncFriends, 500);
            }
            callback(success);
        });
    } else {
        console.log("user present");
        syncFriends();
        callback(true);
    }
}



//post the user's public key to the server
//returns a bool of success
function _postPubKey(pub_key, callback) {
    var url = buildUrl(PUB_UPLOAD, {
        'key': encodeURIComponent(pub_key)
    });
    $.get(url, function() {
        callback(true); //success
    }).fail(function() {
        console.log("Pubkey upload error.");
        callback(false); //failure
    });
}

//calls the server to request user list
//merges the friends with the friends in the local store
//server response format
//{
// 'friends':
//     { user_id1:
//         {
//          'name':''
//          'pub_keys':[],
//          'fb_id':'',
//          'fb_handle':'',
//         },
//        user_id2:{},
//        ...
//      }
// }
//function syncFriends() {
//    var user_meta = loadLocalStore('user_meta');
//    if (!Object.size(user_meta)){
//        return
//    }
//    var url = buildUrl(FRIENDS);
//    $.get(url, function(friend_data){
//        var user_map = loadLocalStore("user_map");
//        var count = 0;
//
//        if (!Object.size(friend_data.friends)) return;
//
//        $.each(friend_data.friends, function(user_id, user_data){
//            var username = (user_data.fb_handle) ? user_data.fb_handle : user_id;
//            user_map[username] = user_data;
//            count ++;
//            if (count === Object.size(friend_data.friends)) {
//                writeLocalStorage("user_map", user_map)
//            }
//        });
//    });
//}

function getPubKeysFromServer(username) {
    var cached_users = loadLocalStore('cached_users');
    var url = buildUrl(GET_PUBKEYS);
    var pub_keys;
    return $.ajax({
        type: "POST",
        url: url,
        data: {
            "email": username
        },
        success: function(res) {
            pub_keys = res.pub_keys;
            cached_users[username] = pub_keys;
            writeLocalStorage("cached_users", cached_users);
        },
        async: false
    }).responseText.pub_keys;
}

function recoverPriKey(encrypted_pri_key, password) {
    var pri_key = decryptAES(encrypted_pri_key, password);
    return deserializePrivKey(JSON.parse(pri_key));
}

function getPriKeyFromServer() {
    var url = buildUrl(GET_PRI_KEY);
    var pri_key;
    $.ajax({
        type: "GET",
        url: url,
        success: function(res) {
            pri_key = res.pri_key;
        },
        async: false
    });
    return pri_key
}


function uploadPubKey(username, pub_key) {
    var url = buildUrl(PUB_UPLOAD);
    $.ajax({
        type: "POST",
        url: url,
        data: {
            "username": username,
            "pub_key": pub_key
        },
        //        data:
        //        {
        //            "username":"username",
        //            "pub_key":"pub_key"
        //        },
        success: function(returned) {
            return true;
        },
        failure: function() {
            return false;
        },
        async: false
    });
}

function uploadPriKey(username, pri_key) {
    var url = buildUrl(PRI_UPLOAD);
    $.ajax({
        type: "POST",
        url: url,
        data: {
            "username": username,
            "pri_key": pri_key
        },
        success: function(returned) {
            return true;
        },
        failure: function() {
            return false;
        },
        async: false
    });
}

//update whether a user will_encrypt or not
//function setEncrypt(will_encrypt, callback) {
//    console.log(will_encrypt);
//    var user_meta = loadLocalStore('user_meta');
//    if (!Object.size(user_meta)){
//        return
//    }
//    user_meta.will_encrypt = will_encrypt;
//    writeLocalStorage('user_meta', user_meta);
//    var url = buildUrl(SET_ENCRYPT, {
//        'will_encrypt' : will_encrypt,
//    });
//    $.get(url, function(){
//        callback(true); //success
//    }).fail(function() {
//            console.log("setEncrypt error.");
//            callback(false); //failure
//        });
//}