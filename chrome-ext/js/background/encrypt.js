//handles encrypting a plaintext message and
//returning the result
//given a message and user_id or group_id to encrypt for

var encryptMap = {
    'user_id' : _encryptForUser,
    'group_id' : _encryptForGroup,
}

//input ::= plaintext, will_encrypt, encrypt_for, encrypt_type
//will_encrypt ::= global encryption flag
//encrypt_for ::= user_id or group_id to encrypt for 
//encrypt_type ::= either "user_id" or "group_id" to specify
//where to find pub_keys
//output ::= fakeblock_obj
//fakeblock_obj ::= def in common.js
function encrypt(plaintext, will_encrypt, encrypt_for, encrypt_type) {
    var encryptForFunc = encryptMap[encrypt_type];
    if (!will_encrypt || encrypt_for === null || encryptForFunc === undefined) {
        return plaintext
    }

    var user_map = loadLocalStore('user_map');
    var shared_secret, users = encryptForFunc(encrypt_for, user_map);

    if (shared_secret === undefined) { // unable to encrypt
        return plaintext
    }
    
    var sender_username = loadLocalStore('user_meta').username;
    var _, sender_data = _getUserData(sender_username, user_map);
    users[sender_username] = sender_data;

    var cipher_text = Base64.encode(CryptoJS.AES.encrypt(plaintext, shared_secret).toString());
    
    return {
        "users" : users,
        "cipher_text" : cipher_text,
    }
}

//returns a the shared_secret and json dictionary to be used by the fakeblock object
function _encryptForUser(user_id, user_map) {
    var shared_secret, recip_data = _getUserData(user_id, user_map);

    return shared_secret, {
            user_id : recip_data
        }
}

//give a group id build a fakeblock user dict
//returns the group shared secret
function _encryptForGroup(group_id, user_map) {
    var group_map = loadLocalStore("group_map");
    var group_data;

    if (!group_id in group_map) {
        //todo, create group function
        group_data = createGroup(group_id)
    } else {
        group_data = group_map[group_id];
    }

    var users = {}
    var valid = false //at least one friend is found
    
    $.each(group_data.usernames, function(i, username){
        var _, user_data = _getUserData(username, user_map)
        if (user_data !== {}) {
            valid = true;
        }
        users[username] = user_data 
    });

    if (!valid) return undefined, {}
    return group_data.shared_secret, users
}

//returns the shared secret and 
//dict of encrypted sentinals/shared_secrets
//for the given user
//if the user does not exist returns undefined, {}
function _getUserData(username, user_map) {
    
    if (!username in user_map) {
        return undefined, {}
    }
    
    var user_data = user_map[username];
    return user_data.shared_secret, {
            "e_sentinals" : user_data.e_sentinals,
            "e_shared_secrets" : user_data.e_shared_secrets,
        }
}
