//returns a plaintext result of the decryption
//or an empty string if decryption fails.
function decrypt(fakeblock) {
    console.log(fakeblock.users)
    var user_meta = loadLocalStore('user_meta');
    if (!Object.size(user_meta)){
        return ""
    }

    var encrypted_data = fakeblock.users[user_meta.username];
    if (encrypted_data === undefined) {
        return ""
    }

    var e_sentinals = encrypted_data.e_sentinals;
    var e_shared_secrets = encrypted_data.e_shared_secrets;
    var priv_key = deserializePrivKey(user_meta.priv_key);
    for (var i = 0; i < e_sentinals.length; i++) {
        if (cryptico.decrypt(e_sentinals[i], priv_key).plaintext === SENTINAL) {
            var shared_secret = cryptico.decrypt(e_shared_secrets[i], priv_key).plaintext;
            var decrypted = CryptoJS.AES.decrypt(Base64.decode(fakeblock.cipher_text), shared_secret);
            var to_return = decrypted.toString(CryptoJS.enc.Utf8);
            return to_return;
        }
    }
    return ""
}

