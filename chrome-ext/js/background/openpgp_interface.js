function convertPGPPKeyTextToKeyObject(key_text) {
    return window.openpgp.key.readArmored(key_text).keys[0];
}

function convertPGPMessageToMessageObject(cipher_text) {
    return window.openpgp.message.readArmored(cipher_text);
}

function openpgp_test(key_pair) {
    if (typeof key_pair === "undefined") {
        key_pair = window.openpgp.generateKeyPair(1, rsaBitLength, "testtest@mailinator.com", PARSELTONGUE_DEFAULT_PASSWORD);
    }
    var pri_key = key_pair.privateKeyArmored;
    var pub_key = key_pair.publicKeyArmored;
    var pub_key_object = convertPGPPKeyTextToKeyObject(pub_key);
    var pri_key_object = convertPGPPKeyTextToKeyObject(pri_key);
    pri_key_object.decrypt(PARSELTONGUE_DEFAULT_PASSWORD);
    var test_message = "this is a test message<br>";
    var pub_keys = [pub_key_object];
    var cipher_text = window.openpgp.encryptMessage(pub_keys, test_message);
    writeLocalStorage("cipher_text_from_test", cipher_text);
    var cipher_text_object = convertPGPMessageToMessageObject(cipher_text);
    var decrypted_text =  window.openpgp.decryptMessage(pri_key_object, cipher_text_object);
    if (decrypted_text != test_message) {
        console.log("OPENPGP ERROR");
        return false;
    }
    else {
        return true;
//        console.log("OPENPGP SUCCESS");
    }
}

function openpgp_test2(plaintext, cipher_text) {
    var sender_meta = loadLocalStore('userMeta');
    var username = sender_meta.username;
    var pri_key = sender_meta.pri_key;
    var pri_key_object = getPriKeyObjectFromLocalStorage();
    var cached_users = getCachedUsers([username]);
    var pub_key = cached_users[username];
    var pub_key_object = convertPGPPKeyTextToKeyObject(pub_key);
    var pub_keys = [pub_key_object];
    if (typeof plaintext === "undefined") {
        plaintext = "this is a test message<br>";
    }
    if (typeof cipher_text === "undefined") {
        cipher_text = window.openpgp.encryptMessage(pub_keys, test_message);
    }
    var cipher_text_object = convertPGPMessageToMessageObject(cipher_text);

    // compare to see if stuff is what it should be
    var pri_key_after_creation = loadLocalStore("pri_key_after_creation");
    if (pri_key != pri_key_after_creation) {
        debugger;
    }
    var pub_key_after_creation = loadLocalStore("pub_key_after_creation");
    if (pub_key != pub_key_after_creation) {
        debugger;
    }

    var decrypted_text =  window.openpgp.decryptMessage(pri_key_object, cipher_text_object);
    if (decrypted_text != plaintext) {
        console.log("OPENPGP ERROR2");
    }
    else {
//        console.log("OPENPGP SUCCESS2");
    }
}
