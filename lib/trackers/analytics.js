const db = require('../../db');

var analytics = {sentMessages: 0, transactions: 0, dailyCollected: 0};

module.exports.increment = function(stat) {
    analytics[stat]++;
}

module.exports.fetch = function() {
    return analytics;
}

module.exports.save = async function() {
    let change = {};
    for(const[key, val] of Object.entries(analytics)) {
        change[key] = val;
    }
    analytics = {sentMessages: 0, transactions: 0, dailyCollected: 0};
    await db.server.saveAnalytics(change);
    console.log(`Saved Analytics!`);
    return;
}