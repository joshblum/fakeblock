//returns a plaintext result of the decryption
//or an empty string if decryption fails.
function decrypt(fakeblock) {
    var userMeta = loadLocalStore('userMeta');
    if (!Object.size(userMeta)) {
        //maybe should use null instead of ""
        return null;
    }

    var pub_key_id = cryptico.publicKeyID(userMeta.pub_key);
    if (!(pub_key_id in fakeblock.keys)) {
        return null;
    }
    var encrypted_key = fakeblock.keys[pub_key_id];
    var pri_key = deserializePriKey(userMeta.pri_key);

    var key = cryptico.decrypt(encrypted_key, pri_key).plaintext;
    return decryptAES(Base64.decode(fakeblock.cipher_text), key);
}

function decryptAES(cipher_text, secret) {
    var decrypted = CryptoJS.AES.decrypt(cipher_text, secret);
    return decrypted.toString(CryptoJS.enc.Utf8);
}