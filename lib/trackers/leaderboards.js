const adminCommand = require('../../commands/admin.js');
const datetime = require('../datetime.js');

var postedToday = true;

module.exports.tryLeaderboards = async function() {
    if(!postedToday && datetime.isPastLeaderboardPostTime()) {
        postedToday = true;
        const startTime = Date.now();
        await adminCommand.sendLeaderboards(null, '707314237130801264');
        console.log(`Posted Leaderboards! - ${Date.now() - startTime}ms`);
    } else if(!datetime.isPastLeaderboardPostTime()) {
        postedToday = false;
        console.log('Leaderboards - New Day!');
    }
}