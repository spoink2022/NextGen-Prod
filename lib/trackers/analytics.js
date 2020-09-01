const config = require('../../private/config.json');

const db = require('../../db');
const datetime = require('../datetime.js');

var analytics = {messages: 0, transactions: 0, daily: 0};

module.exports.increment = function(stat) {
    analytics[stat]++;
}

module.exports.fetch = async function() {
    let dbAnalytics = await db.server.fetchAnalytics();
    let toReturn = {};
    for(const[key, val] of Object.entries(analytics)) {
        toReturn[key] = parseInt(dbAnalytics[key]) + val;
    }
    return toReturn;
}

module.exports.save = async function() {
    const guild = await globals.client.guilds.fetch(config.nextgenServer);
    let change = {};
    for(const[key, val] of Object.entries(analytics)) {
        change[key] = val;
    }
    analytics = {messages: 0, transactions: 0, daily: 0};
    await db.server.saveAnalytics(change);
    return;
}