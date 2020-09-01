const config = require('../../private/config.json');

const db = require('../../db');
const datetime = require('../datetime.js');

var analytics = {messages: 0, transactions: 0, daily: 0};

module.exports.increment = function(stat) {
    analytics[stat]++;
}

module.exports.fetch = async function() {
    const guild = await globals.client.guilds.fetch(config.nextgenServer);
    let dbAnalytics = await db.server.fetchAnalytics();
    let toReturn = {};
    for(const[key, val] of Object.entries(analytics)) {
        toReturn[key] = parseInt(dbAnalytics[key]) + val;
    }
    toReturn.members = guild.memberCount;
    return toReturn;
}

module.exports.save = async function() {
    const guild = await globals.client.guilds.fetch(config.nextgenServer);
    let change = {
        messages: analytics.messages,
        transactions: analytics.transactions,
        daily: analytics.daily
    };
    let fixed = {
        members: guild.memberCount
    };
    analytics = {messages: 0, transactions: 0, daily: 0};
    await db.server.saveAnalytics(change, fixed);
    return;
}