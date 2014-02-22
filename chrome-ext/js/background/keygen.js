//lib for creating a shared secret and RSA pub/pri keys
// The length of the RSA key, in bits.
var rsaBitLength = 1024;
// default to 256-bit aes key
var aesBitLength = 256;
// the password which private key is "encrypted" with is parseltongue
var PARSELTONGUE_DEFAULT_PASSWORD = "parseltongue";

//generate a random passphrase
//used to generate passphrases
function randString(length) {
    length = length ? length : aesBitLength / 8;
    randBuf = new Uint8Array(length);
    window.crypto.getRandomValues(randBuf);
    return arrayBufferToString(randBuf);
}

function arrayBufferToString(buf) {
    /*
    from http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
    */
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function genKeys(email, password) {
    /**
     * Generates a new OpenPGP key pair. Currently only supports RSA keys.
     * Primary and subkey will be of same type.
     * @param {module:enums.publicKey} keyType    to indicate what type of key to make.
     *                             RSA is 1. See {@link http://tools.ietf.org/html/rfc4880#section-9.1}
     * @param {Integer} numBits    number of bits for the key creation. (should be 1024+, generally)
     * @param {String}  userId     assumes already in form of "User Name <username@email.com>"
     * @param {String}  passphrase The passphrase used to encrypt the resulting private key
     * @param  {function} callback (optional) callback(error, result) for async style
     * @return {Object} {key: Array<module:key~Key>, privateKeyArmored: Array<String>, publicKeyArmored: Array<String>}
     * @static
     */
    // the password which private key is "encrypted" with to store in localstorage is parseltongue
    var found_valid_key_pair = false;
    var key_pair;
    // create a key pair and then test to see if it worked. Do this up to 5 times... it always works first time anyway
    for (var i=0;i<5;i++) {
        if (!found_valid_key_pair) {
            key_pair = window.openpgp.generateKeyPair(1, rsaBitLength, email, PARSELTONGUE_DEFAULT_PASSWORD);
            found_valid_key_pair = openpgp_test(key_pair);
        }
    }
    if (!found_valid_key_pair) {
        logErrorToServer("Failed to create valid pgp key pair for " + email);
    }
    var pri_key = key_pair.privateKeyArmored;
    var pub_key = key_pair.publicKeyArmored;
    return {
        "pri_key": pri_key,
        "pub_key": pub_key
    }
}

// gets a private key object ready for use from local storage
function getPriKeyObjectFromLocalStorage() {
    var userMeta = loadLocalStore('userMeta');
    var pri_key = userMeta.pri_key;
    // creates an openpgp private key object from the private key text
    var pri_key_object = convertPGPPKeyTextToKeyObject(pri_key);
    pri_key_object.decrypt(PARSELTONGUE_DEFAULT_PASSWORD);
    return pri_key_object;
}

//convert json_parsed_key into an RSA object
//returns deserlized RSA obj
function deserializePriKey(json_parsed_key) {
    var pri_key = new RSAKey();
    for (k1 in json_parsed_key) {
        var nbi = new BigInteger();
        var val = json_parsed_key[k1];
        for (k2 in val) {
            nbi[k2] = val[k2];
        }
        pri_key[k1] = nbi;
    }
    return pri_key
}

// creates a pub key and a pri key for user, and encrypts the pri key
// with the inputted password
// and then stores all 3 to local storage
// registration stores pub/pri/encrypted_pri_key which have not been uploaded yet
function userInitialize(username, password) {
    var key_pair = genKeys(username, password);
    var encrypted_pri_key = encryptPriKey(key_pair.pri_key, password);
    var registration = {
        "pri_key": key_pair.pri_key,
        "pub_key": key_pair.pub_key,
        "encrypted_pri_key": encrypted_pri_key,
        "username": username,
        "completed": false
    };
    writeLocalStorage("registration", registration);
    return registration;
}

// returns a password encrypted version of a private key
function encryptPriKey(pri_key, password) {
    return encryptAES(JSON.stringify(pri_key), password);
}


// if there is non-completed user data in registration in local storage,
// then it uploads this data to the server, and sets registration to completed
function uploadUserData() {
    var registration_data = loadLocalStore("registration");
    if (!("completed" in registration_data)) {
        // they have accessed an initialize page from a different computer, or cleared local storage
        // therefore we do not have their password
        // prompt them to login
        window.location.href = "/login/";
        return
    } else if (registration_data["completed"]) {
        // TODO: we have a problem, they have already uploaded their shit,
        // ... maybe not a problem, but would like to be warned
        return
    } else {
        var pri_key = registration_data["pri_key"]; // TODO stringify pri_key
        var pub_key = registration_data["pub_key"];
        var encrypted_pri_key = registration_data["encrypted_pri_key"];
        var username = registration_data["username"];
        var success = uploadPubKey(username, pub_key);
        var success2 = uploadPriKey(username, encrypted_pri_key);
        // TODO: check if both uploads were successful
        var userMeta = createUserMeta(username, pub_key, pri_key); 
        writeLocalStorage("userMeta", userMeta);
        registration_data["completed"] = true;
        writeLocalStorage("registration", registration_data);
    }
}

// logout, clears localstorage !!!
function parseltongueLogout() {
    deleteDjangoCookie();
    localStorage.clear();
    localStorage.first = "true";
}

function deleteDjangoCookie() {
    chrome.cookies.remove({
        "url": "https://getparseltongue.com",
        "name": "sessionid"
    }, function(cookie) {});
}
