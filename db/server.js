const config = require('./config.js');

const endpoints = require('../endpoints');

const datetime = require('../lib/datetime.js');
const gameLogic = require('../lib/gameLogic.js');

module.exports.getDaily = async function(day) {
    let query = 'SELECT type, data FROM game_daily WHERE day_varchar=$1';
    let reward = (await config.pquery(query, [day]))[0];
    return reward;
}

module.exports.getDailyMultiple = async function(day, foresight) {
    let query = 'SELECT * FROM game_daily WHERE day>=$1 ORDER BY day LIMIT $2';
    let rewards = await config.pquery(query, [day, foresight]);
    return rewards;
}

module.exports.setDaily = async function(day, type, value) {
    if(await this.getDaily(day)) { // overwrite
        var query = 'UPDATE game_daily SET type=$1, data=$2 WHERE day_varchar=$3';
        await config.pquery(query, [type, value, day]);
    } else { // insert
        var query = 'INSERT INTO game_daily (type, data, day, day_varchar) VALUES ($1, $2, $3, $4)';
        await config.pquery(query, [type, value, new Date(day), day]);
    }
    return;
}

module.exports.saveAnalytics = async function(change, fixed) {
    let query = 'UPDATE analytics SET messages=messages+$1, transactions=transactions+$2, daily=daily+$3, members=$4';
    await config.pquery(query, [change.messages, change.transactions, change.daily, fixed.members]);
    return;
}

module.exports.fetchAnalytics = async function() {
    let query = 'SELECT * FROM analytics';
    let analytics = (await config.pquery(query))[0];
    return analytics;
}

module.exports.fetchUsersWithOrders = async function() {
    let query = 'SELECT userid, money, stocks, stock_orders FROM users WHERE ARRAY_LENGTH(stock_orders, 1) > 0';
    let users  = await config.pquery(query);
    return users;
}

module.exports.fetchUsersWithAccounts = async function() {
    let query = `SELECT userid, money, stocks, crypto, savings FROM users WHERE tutorial != 'init'`;
    let users = await config.pquery(query);
    return users;
}

module.exports.clearOrders = async function() {
    let query = 'UPDATE users SET stock_orders = ARRAY[]::TEXT[]';
    await config.pquery(query);
    return;
}

module.exports.updateLatestRank = async function(leaderboards) {
    let query = 'UPDATE users SET latest_rank=0';
    await config.pquery(query);
    let values = `('${leaderboards[0]}', 1)`;
    for(let i=1; i<leaderboards.length; i++) { values += `,('${leaderboards[i]}', ${i+1})`; }
    query = `UPDATE users AS t SET latest_rank = c.latest_rank FROM (VALUES ${values}) AS c(userid, latest_rank) WHERE c.userid=t.userid`;
    await config.pquery(query);
}