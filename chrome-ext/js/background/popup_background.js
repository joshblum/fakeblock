function getSingleUsers() {
	return [{ 'stephanie' : 'swanggg'}]

	var user_meta = loadLocalStore(user_meta)
	if (!user_meta) {
		//maybe we should know if user_meta isn't set yet? dunno, ask josh
		return []
	}
	var selfname = user_meta.username
    var user_map = loadLocalStore('user_map');
	delete user_map.selfname;
	var users = [];
	for (user in user_map) {
		users.push({
			user : user_map.user.name
		});
	}
	return users;
}