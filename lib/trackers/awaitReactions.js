var pendingUsers = [];

module.exports.add = function(userid) { // returns true if no user existed and therefore was successfully added, false otherwise
    if(pendingUsers.includes(userid)) { return false; }
    pendingUsers.push(userid);
    return true;
}

module.exports.remove = function(userid) {
    let index = pendingUsers.indexOf(userid);
    pendingUsers.splice(index, 1);
    return;
}