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
//         pub_key : [,,,],
//         shared_secret : "",
//         e_shared_secrets : [,,,],
//         e_sentinals : [,,,],
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