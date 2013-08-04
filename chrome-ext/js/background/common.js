//global variables and helper functions

//localStorage datastructures
//fakeblock ::=
//{
//  "users:" {
//      "username" : {
//              //used to verify decryption possible
//              e_sentinals : [,,,], 
//              e_shared_secrets : [,,,],
//      },
//      ...
//  },
//  "cipher_text" : "",
// }

//user_meta ::= 
// {
//  "pub_key" : "",
//  "priv_key" : "",
//  "username" : "",
//  "encrypt_for" : "",
// }

// user_map ::=
// {
//     "username" :  {
//         "pub_keys" : [,,,],
//         "fb_handle" : "",
//         "fb_id" : "",
//         "name" : "",
//     },
//     ...
// }

// group_map ::= 
// {
//     "group_id" : {
//         "usernames" : [,,,],
//         "shared_secret" : "",
//     },
//     ...
// }

///////////Global vars/////////////
// global website base, set to localhost for testing, use deploy script to change
var baseUrl = "http://localhost:5000";
// var baseUrl = "http://fakeblock.herokuapp.com";
var SENTINAL = "fakeblock";

//returns a JSON object of the key or empty dict
function loadLocalStore(key) {
    var localString = localStorage.getItem(key);
    // catch undefined case
    localString = (localString) ? localString : "{}"; 
    return JSON.parse(localString);
}
//http://stackoverflow.com/questions/5223/length-of-javascript-object-ie-associative-array
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};
