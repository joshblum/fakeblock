//returns a plaintext result of the decryption

function decrypt(cipher_text) {
    var userMeta = loadLocalStore('userMeta');
    if (!Object.size(userMeta)) {
        //maybe should use null instead of ""
        return null;
    }

    // openpgp pri key object from local storage
    var pri_key_object = getPriKeyObjectFromLocalStorage();
    var cipher_text_object = convertPGPMessageToMessageObject(cipher_text);

    /**
 * Decrypts message
 * @param  {module:key~Key}     privateKey private key with decrypted secret key data
 * @param  {module:message~Message} msg    the message object with the encrypted data
 * @param  {function} callback (optional) callback(error, result) for async style
 * @return {(String|null)}        decrypted message as as native JavaScript string
 *                              or null if no literal data found
 * @static
 */
    var decrypted_text =  window.openpgp.decryptMessage(pri_key_object, cipher_text_object);
    return decrypted_text;
}


/// old
function decryptAES(cipher_text, secret) {
    var decrypted = CryptoJS.AES.decrypt(cipher_text, secret);
    return decrypted.toString(CryptoJS.enc.Utf8);
}