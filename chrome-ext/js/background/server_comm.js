//houses the login and syncFriends function

var PUB_UPLOAD = "/upload_pubkey/";
var FRIENDS = "/friends/";

//creates user_meta storage if it does not exist
//and posts the pub_key to server
function login(username, callback){
    var user_meta = loadLocalStore('user_meta');
    if (user_meta === {}) {
        user_meta = _createUserMeta(username);
        _postPubKey(user_meta.pub_key, function(success){
            callback(success) 
        });
    } else {
        callback(true)
    }
}

//generates a pub/priv RSA key pair for a user
//stores the user_meta to localStorage
function _createUserMeta(username) {
    priv_key, pub_key = genKeys();
    var user_meta = {
        'username' : username,
        'encrypt_for' : "",
        'priv_key' : priv_key,
        'pub_key' : pub_key,
    }
    localStorage.setItem("user_meta", user_meta);
    return user_meta
}

//post the user's public key to the server
//returns a bool of success
function _postPubKey(pub_key, callback) {
    var url = buildUrl(PUB_UPLOAD, {'key' : pub_key})
    $.get(url, function(){
        callback(true); //success
    }).fail(function(
        callback(false); //failure
    ));
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
    if (user_meta === {}){
        return
    }
    var url = buildUrl(FRIENDS)
    $.get(url, function(friend_data){
        var user_map = loadLocalStore("user_map");
        $.each(friend_data.friends, function(i, user_id){
            var user_data = friend_data.friends[user_id];
            var username = (user_data.fb_handle) ? user_data.fb_handle : user_id;
            user_map[username] = user_data;
            if (i === Object.size(friend_data.friends)) {
                localStorage.setItem("user_map", user_map)
            }
        });
    });
}