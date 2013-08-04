//handles encrypting a plaintext message and
//returning the result
//given a message and user_id or group_id to encrypt for

//input ::= plaintext, will_encrypt, encrypt_for
//encrypt_for ::= [username, ..., ]
//where to find pub_keys
//output ::= fakeblock_obj
//fakeblock_obj ::= def in common.js
function encrypt(plaintext, encrypt_for) {
    // console.log(arguments);
    var sender_meta = loadLocalStore('user_meta');
    //we can't encrypt
    if (sender_meta === {} || (encrypt_for === [] && sender_meta.encrypt_for === [])) {
        return plaintext
    }

    //default to stored username
    if (encrypt_for === []){
        encrypt_for = sender_meta.encrypt_for;
    }

    //add self
    encrypt_for.push(sender_meta.username)

    var user_map = loadLocalStore('user_map');
    var shared_secret = randString();
    var users = {};
    $.each(encrypt_for, function(i, username){
        var user_data = _getUserData(username, shared_secret,user_map);
        if (Object.size(user_data)) { //user exists
            users[username] = user_data
        }
    });

    if (users <= 1) { //only found own data
        return plaintext
    }

    var cipher_text = Base64.encode(CryptoJS.AES.encrypt(plaintext, shared_secret).toString());

    var res = {
        "users" : users,
        "cipher_text" : cipher_text
    }
    // console.log(res)
    return res
}

//returns the shared secret and 
//dict of encrypted sentinals/shared_secrets
//for the given user
//if the user does not exist returns undefined, {}
function _getUserData(username, shared_secret, user_map) {
    if (!(username in user_map)) return {}
        
    var user_data = user_map[username];
    if (!user_data.pub_keys.length) return {}

    return genEncryptedMeta(user_data.pub_keys, shared_secret)
}

//encrypts the shared secret and sentinal for each
//public key provided in the user_data dict
//returns a dictioary:
// {
//         e_shared_secrets : [,,,],
//         e_sentinals : [,,,],
// }
function genEncryptedMeta(pub_keys, shared_secret) {
    var e_sentinals = [];
    var e_shared_secrets = [];
    $.each(pub_keys, function(i, pub_key){
        e_sentinals.push(cryptico.encrypt(SENTINAL, pub_key).cipher);
        e_shared_secrets.push(cryptico.encrypt(shared_secret, pub_key).cipher);
    });

    return {
        "e_sentinals" : e_sentinals,
        "e_shared_secrets" : e_shared_secrets
    }
}
