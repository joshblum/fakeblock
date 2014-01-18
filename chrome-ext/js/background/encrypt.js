/*
    handles encrypting a plaintext message and
    returning the result
    given a message and user_id or group_id to encrypt for

    input ::= plaintext, will_encrypt, encrypt_for
    encrypt_for ::= [username, ..., ]
    where to find pub_keys
    output ::= fakeblock_obj
    fakeblock_obj ::= def in common.js
*/
function _encrypt(plaintext, encrypt_for) {
    var sender_meta = loadLocalStore('user_meta');

    //we can't encrypt
    if (!Object.size(sender_meta) || (encrypt_for === [])) {
        return plaintext
    }

    //add self
    encrypt_for.push(sender_meta.username);

    // these are guys we don't have to go to the server for
    var cached_users = loadLocalStore('cached_users'); 
    var shared_secret = randString();
    var users = {};
    for (i in encrypt_for) {
        var username = encrypt_for[i];
        var user_data = _getUserData(username, shared_secret, cached_users);
        if (Object.size(user_data)) { //user exists
            users[username] = user_data
        }
    }

    if (!Object.size(users) <= 1) { //only found own data
        return plaintext
    }

    var cipher_text = Base64.encode(encryptAES(plaintext, shared_secret));

    var res = {
        "users": users,
        "cipher_text": cipher_text
    };
    return res
}

function encrypt(plaintext, encrypt_for) {
    var res = {
        "users": encrypt_for,
        "cipher_text": "&&& default cypher text for ya &&&"
    };
    return res
}

/*
 returns boolean based on whether or not all usernames are parseltongue users
*/
function canEncryptFor(usernames) {

    var res = {
        "can_encrypt": true
    };
    return res
}

/*
    returns the shared secret and 
    dict of encrypted sentinals/shared_secrets
    this dict has a list of sentinals, and a corresponding list of encrypted shared secrets
    for the given user
    if the user does not exist returns undefined, {}
*/
function _getUserData(username, shared_secret, cached_users) {
    // check cache first
    var pub_keys;
    if (username in cached_users) {
        pub_keys = cached_users[username];
    } else {
        pub_keys = getPubKeysFromServer(username);
    }

    if (pub_keys == null) {
        return {};
    }
    if (!pub_keys.length) return {};

    return genEncryptedMeta(pub_keys, shared_secret)
}

/*
    encrypts the shared secret and sentinal for each
    public key provided in the user_data dict
    returns a dictionary:
     {
             e_shared_secrets : [,,,],
             e_sentinals : [,,,],
     }
*/
function genEncryptedMeta(pub_keys, shared_secret) {
    var e_sentinals = [];
    var e_shared_secrets = [];
    $.each(pub_keys, function(i, pub_key) {
        e_sentinals.push(cryptico.encrypt(SENTINAL, pub_key).cipher);
        e_shared_secrets.push(cryptico.encrypt(shared_secret, pub_key).cipher);
    });

    return {
        "e_sentinals": e_sentinals,
        "e_shared_secrets": e_shared_secrets
    }
}

function encryptAES(plaintext, secret) {
    return CryptoJS.AES.encrypt(plaintext, secret).toString()
}