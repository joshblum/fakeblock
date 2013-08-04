//houses the login and syncFriends function

var PUB_UPLOAD = "/upload_pubkey/";
var FRIENDS = "/friends/";

//creates user_meta storage if it does not exist
//and posts the pub_key to server
function login(fb_id, fb_handle, auth_token, callback){
    var user_meta = loadLocalStore('user_meta');
    var username = (fb_handle) ? fb_handle : fb_id;
    debugger
    if (!Object.size(user_meta)) {
        user_meta = _createUserMeta(username, auth_token);
        _postPubKey(user_meta.pub_key, function(success){
            if (success) {
                setTimeout(syncFriends, 500);
            }
            callback(success);
        });
    } else {
        user_meta.auth_token = auth_token;
        user_meta.username = username;
        syncFriends();
        callback(true)
    }
    writeLocalStorage('user_meta', user_meta);
}

//generates a pub/priv RSA key pair for a user
//stores the user_meta to localStorage
function _createUserMeta(username, auth_token) {
    var key_pair = genKeys();
    var user_meta = {
        'username' : username,
        'encrypt_for' : "",
        'priv_key' : key_pair.priv_key,
        'pub_key' : key_pair.pub_key,
        'auth_token' : auth_token,
    }
    writeLocalStorage("user_meta", user_meta);
    return user_meta
}

//post the user's public key to the server
//returns a bool of success
function _postPubKey(pub_key, callback) {
    var url = buildUrl(PUB_UPLOAD, {'key' : encodeURIComponent(pub_key)})
    $.get(url, function(){
        callback(true); //success
    }).fail(function() {
        console.log("Pubkey upload error")
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
function syncFriends() {
    var user_meta = loadLocalStore('user_meta');
    if (!Object.size(user_meta)){
        return
    }
    var url = buildUrl(FRIENDS)
    $.get(url, function(friend_data){
        var user_map = loadLocalStore("user_map");
        var count = 0;

        if (!Object.size(friend_data.friends)) return
        
        $.each(friend_data.friends, function(user_id, user_data){
            var username = (user_data.fb_handle) ? user_data.fb_handle : user_id;
            user_map[username] = user_data;
            count ++;
            if (count === Object.size(friend_data.friends)) {
                writeLocalStorage("user_map", user_map)
            }
        });
    });
}