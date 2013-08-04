//returns a plaintext result of the decryption
//or an empty string if decryption fails.
function decrypt(fakeblock) {
    var user_meta = loadLocalStore('user_meta');
    if (user_meta === {}){
        return ""
    }

    var encrypted_data = fakeblock.users[user_meta.username];
    if (encrypted_data === undefined) {
        return ""
    }

    var e_sentinals = encrypted_data.e_sentinals;
    var e_shared_secrets = encrypted_data.e_shared_secrets
    for (var i = 0; i < e_sentinals.length; i++) {
        if (cryptico.decrypt(e_sentinals[i], 
            user_meta.priv_key) === SENTINAL) {
            var shared_secret = cryptico.decrypt(e_shared_secrets[i], user_meta.priv_key)
            return CryptoJS.AES.decrypt(Base64.decode(fakeblock.cipher_text), shared_secret).toString(CryptoJS.enc.Utf8);
        }
    }
    return ""
}