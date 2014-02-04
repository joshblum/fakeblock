/*
Messages to send from background to content scripts
*/

function sendDefaultEncrypt(defaultEncrypt) {
	/*
    message to send content script userMeta.defaultEncrypt after value changes (in popup)
    */

	chrome.tabs.query({}, function(tabs) {
		var message = {
			'defaultEncrypt': defaultEncrypt
		};
		for (var i in tabs) {
			chrome.tabs.sendMessage(tabs[i].id, message);
		}
	});
}