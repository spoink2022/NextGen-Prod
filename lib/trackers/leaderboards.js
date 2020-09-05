const adminCommand = require('../../commands/admin.js');
const datetime = require('../datetime.js');

var postedToday = true;

module.exports.tryLeaderboards = async function() {
    if(!postedToday && datetime.isPastLeaderboardPostTime()) {
        postedToday = true;
        const startTime = Date.now();
        await adminCommand.sendLeaderboards(null, '710568729041436693');
        console.log(`Posted Leaderboards! - ${Date.now() - startTime}ms`);
    } else if(postedToday && !datetime.isPastLeaderboardPostTime()) {
        postedToday = false;
        console.log('Leaderboards - New Day!');
    }
}