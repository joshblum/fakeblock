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
function encrypt(plaintext, encrypt_for) {
    
    var sender_meta = loadLocalStore('userMeta');

    //we can't encrypt
    if (!Object.size(sender_meta) || (encrypt_for.length === 0)) {
        return plaintext
    }

    //add self
    encrypt_for.push(sender_meta.username);

    var shared_secret = randString();
    var users = {};
    var cachedUsers = getCachedUsers(encrypt_for);
    var username, user_data;
    for (i in encrypt_for) {
        username = normalizeEmail(encrypt_for[i]);
        user_data = genEncryptedMeta(cachedUsers[username], shared_secret);
        if (Object.size(user_data)) { //user exists
            users[username] = user_data
        }
    }


    var cipher_text = Base64.encode(encryptAES(plaintext, shared_secret));

    var res = {
        "users": users,
        "cipher_text": cipher_text
    };
    return res
}

function getCachedUsers(encrypt_for) {
    updateCache(encrypt_for);
    return loadLocalStore('cachedUsers'); 

}

//update the cache with any users we don't have
function updateCache(encrypt_for) {
    var cachedUsers = loadLocalStore('cachedUsers'); 
    var uncached = [];
    for (i in encrypt_for) {
        if (!(encrypt_for[i] in cachedUsers)) {
            uncached.push(encrypt_for[i]);
        }
    }
    if (uncached.length > 0){
        getPubKeysFromServer(uncached);
    }
}

/*
 returns boolean based on whether or not all usernames are parseltongue users
*/
function canEncryptFor(usernames) {
    if (usernames.length == 0 || usernames.indexOf(null) >= 0) {
        return false;
    }
    var pub_keys = getPubKeysFromServer(usernames);
    var can_encrypt = true;
    
    for (i in pub_keys) {
        var pub_key = pub_keys[i];
        if (!pub_key.length) {
            can_encrypt = false;
            break
        }
    }

    return {
        "can_encrypt": can_encrypt,
    };
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

    if (pub_keys == null || !pub_keys.length) {
        return {};
    }

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
