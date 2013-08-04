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
    return {
        "priv_key" : priv_key,
        "pub_key" :  pub_key,
    }
}

//convert json_parsed_key into an RSA object
//returns deserlized RSA obj
function deserializePrivKey(json_parsed_key) {
    var priv_key = new RSAKey();
    for (k1 in json_parsed_key) {
        var nbi = new BigInteger();
        var val = json_parsed_key[k1];
        for (k2 in val){
            nbi[k2] = val[k2];
        }
        priv_key[k1] = nbi;
    }
    return priv_key
}