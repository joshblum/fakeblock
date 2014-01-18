//returns a plaintext result of the decryption
//or an empty string if decryption fails.
function decrypt(fakeblock) {
    var user_meta = loadLocalStore('user_meta');
    if (!Object.size(user_meta)) {
        return ""
    }

    var encrypted_data = fakeblock.users[user_meta.username];
    if (encrypted_data === undefined) {
        return ""
    }

    var e_sentinals = encrypted_data.e_sentinals;
    var e_shared_secrets = encrypted_data.e_shared_secrets;
    var pri_key = deserializePriKey(user_meta.pri_key);

    for (var i = 0; i < e_sentinals.length; i++) {
        if (cryptico.decrypt(e_sentinals[i], pri_key).plaintext === SENTINAL) {
            var shared_secret = cryptico.decrypt(e_shared_secrets[i], pri_key).plaintext;
            var decrypted = decryptAES(Base64.decode(fakeblock.cipher_text), shared_secret);
            return Base64.decode(decrypted);
        }
    }
    return ""
}

function decryptAES(cipher_text, secret) {
    var decrypted = CryptoJS.AES.decrypt(cipher_text, secret);
    return decrypted.toString(CryptoJS.enc.Utf8);
}