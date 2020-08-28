const config = require('./config.js');

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
    } else { // insert
        var query = 'INSERT INTO game_daily (type, data, day, day_varchar) VALUES ($1, $2, $3, $3)';
    }
    await config.pquery(query, [type, value, day]);
    return;
}

module.exports.saveAnalytics = async function(change) {
    let query = 'UPDATE analytics SET messages=messages+$1, transactions=transactions+$2, daily=daily+$3';
    await config.pquery(query, [change.sentMessages, change.transactions, change.dailyCollected]);
    return;
}

module.exports.handleBuyOrders = async function() {
    
}