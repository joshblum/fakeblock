function getSingleUsers() {
	var user_meta = loadLocalStore("user_meta");
	if (!Object.size(user_meta)) {
		openLink(buildUrl(CONNECT));	
		//maybe we should know if user_meta isn't set yet? dunno, ask josh
		return []
	}
	var selfname = user_meta.username;
    var user_map = loadLocalStore('user_map');
	var users = [];
	for (username in user_map) {
		if (username === selfname) continue
		users.push({
			fullname : user_map[username].name,
			username : username,
		});
	}
	return users;
}