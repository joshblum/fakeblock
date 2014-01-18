//lib for creating a shared secret and RSA pub/priv keys
// The length of the RSA key, in bits.
var bitlength = 1024;

//generate a random passphrase
//used to generate passphrases
function randString(length) {
    var text = "";
    var length = length || 26;
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}

//generates and returns a public/private key pair
//for a user
function genKeys() {
    var pri_key = cryptico.generateRSAKey(randString(), bitlength);
    var pub_key = cryptico.publicKeyString(pri_key);
    return {
        "pri_key": pri_key,
        "pub_key": pub_key,
    }
}

//convert json_parsed_key into an RSA object
//returns deserlized RSA obj
function deserializePrivKey(json_parsed_key) {
    var priv_key = new RSAKey();
    for (k1 in json_parsed_key) {
        var nbi = new BigInteger();
        var val = json_parsed_key[k1];
        for (k2 in val) {
            nbi[k2] = val[k2];
        }
        priv_key[k1] = nbi;
    }
    return priv_key
}

// creates a pub key and a pri key for user, and encrypts the pri key
// with the inputted password
// and then stores all 3 to local storage
// registration stores pub/pri/encrypted_pri_key which have not been uploaded yet
function userInitialize(username, password) {
    // debugger;
    var key_pair = genKeys();
    var encrypted_pri_key = encryptPriKey(key_pair.pri_key, password);
    var registration = {
        "pri_key": key_pair.pri_key,
        "pub_key": key_pair.pub_key,
        "encrypted_pri_key": encrypted_pri_key,
        "username": username,
        "completed": false,
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
    debugger;
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
        var user_meta = {
            "username": username,
            "pri_key": pri_key
        };
        writeLocalStorage(user_meta);
        registration_data["completed"] = true;
        writeLocalStorage(registration_data);
    }
}