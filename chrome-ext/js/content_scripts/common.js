function sendMessage(dict, callback) {
    chrome.runtime.sendMessage(JSON.stringify(dict), callback);
}