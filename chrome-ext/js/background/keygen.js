//lib for creating a shared secret and RSA pub/priv keys
// The length of the RSA key, in bits.
var bitlength = 1024;

//generate a random passphrase
//used to generate passphrases
function randString(length) {
    var text = "";
    var length = length || 26;
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for(var i=0; i < length; i++){
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
        
    return text;
}

//generates and returns a public/private key pair
//for a user
function genKeys() { 
    var priv_key = cryptico.generateRSAKey(randString(), bitlength);
    var pub_key = cryptico.publicKeyString(priv_key);
    return priv_key, pub_key
}
