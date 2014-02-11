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
    //self or associated email may already be in this list, but minimal cost to encrypt shared secret twice 
    encrypt_for.push(sender_meta.username);

    var shared_secret = randString();
    var keys = {};
    var cachedUsers = getCachedUsers(encrypt_for);
    var username, pub_key, pub_key_id, encrypted_key;
    for (i in encrypt_for) {
        username = normalizeEmail(encrypt_for[i]);
        // encrypt_for should already be checked through other means
        // but if username's pub key isn't available, don't encrypt
        if (! (username in cachedUsers)) {
            return plaintext;
        }

        pub_key = cachedUsers[username];
        pub_key_id = cryptico.publicKeyID(cachedUsers[username]);
        encrypted_key = cryptico.encrypt(shared_secret, pub_key).cipher; 

        keys[pub_key_id] = encrypted_key;
    }

    var cipher_text = Base64.encode(encryptAES(plaintext, shared_secret));

    var res = {
        "keys": keys,
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
        var email = encrypt_for[i];
        if (email in cachedUsers && cachedUsers[email].length == 0) {
            //invalidate empty cache entries 
            delete cachedUsers[email];
        }
        if (!(email in cachedUsers)) {
            uncached.push(email);
        }
    }
    //add deletes
    writeLocalStorage("cachedUsers", cachedUsers);
    if (uncached.length > 0) {
        //adds keys to cache
        getPubKeysFromServer(uncached);
    }
}

/*
 returns boolean based on whether or not all usernames are parseltongue users
 input list of usernames, duplicates removed 
*/
function canEncryptFor(usernameDict) {
    var canEncryptRes = {
        "can_encrypt_to" : false,
        "can_encrypt_from" : false,
    };

    var sender_meta = getUserMeta();

    // can't encrypt if user not signed in
    // or if an incomplete username dictionary object is passed in
    if (!Object.size(sender_meta) ||
        !("to" in usernameDict) ||
        !("from" in usernameDict)) {
        return canEncryptRes;
   }

    var usernames = usernameDict["to"].concat(usernameDict["from"]);
    var cachedUsers = getCachedUsers(usernames);

    canEncryptRes["can_encrypt_to"] = canEncryptForList(usernameDict["to"], cachedUsers)
    canEncryptRes["can_encrypt_from"] = canEncryptForList(usernameDict["from"], cachedUsers)

    return canEncryptRes;
}

function canEncryptForList(usernames, ptUsers) {
    if (usernames.length == 0 || usernames.indexOf(null) >= 0) {
        return false;
    }
    var canEncrypt = true;

    for (var i = 0; i < usernames.length; i++) {
        var username = usernames[i];
        if (!(username in ptUsers)) {
            canEncrypt = false;
            break
        }
    }

    return canEncrypt 
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