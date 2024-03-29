const config = require('./config.js');

// STOCK PICK #1
module.exports.fetchStockPickUser = async function(userid) {
    let query = 'SELECT * FROM stock_pick WHERE userid=$1';
    let stockPickUser = (await config.pquery(query, [userid]))[0];
    return stockPickUser;
}

module.exports.fetchStockPickUsers = async function() {
    let query = 'SELECT * FROM stock_pick';
    let stockPickUsers = await config.pquery(query);
    return stockPickUsers;
}

module.exports.fetchStocksPicked = async function() {
    let query = 'SELECT DISTINCT(pick) FROM stock_pick';
    let stocksPicked = await config.pquery(query);
    return stocksPicked;
}

module.exports.setBuyPrices = async function(prices) {
    let firstValue = true, values = '';
    for(const[key, val] of Object.entries(prices)) {
        if(firstValue) { firstValue = false; }
        else { values += ','; }
        values += `('${key}', ${val.previousClose ? val.previousClose : val.price}, '${val.companyName}')`;
    }
    query = `UPDATE stock_pick AS t SET buy_price=c.buy_price, company_name=c.company_name FROM (VALUES ${values}) AS c(pick, buy_price, company_name) WHERE c.pick=t.pick`;
    await config.pquery(query);
}

module.exports.fetchStocksPicked2 = async function() {
    let query = 'SELECT DISTINCT(pick2) FROM stock_pick';
    let stocksPicked = await config.pquery(query);
    return stocksPicked;
}

module.exports.setBuyPrices2 = async function(prices) {
    let firstValue = true, values = '';
    for(const[key, val] of Object.entries(prices)) {
        if(firstValue) { firstValue = false; }
        else { values += ','; }
        values += `('${key}', ${val.previousClose ? val.previousClose : val.price}, '${val.companyName}')`;
    }
    query = `UPDATE stock_pick AS t SET buy_price2=c.buy_price2, company_name2=c.company_name2 FROM (VALUES ${values}) AS c(pick2, buy_price2, company_name2) WHERE c.pick2=t.pick2`;
    await config.pquery(query);
}

module.exports.updateLatestRank = async function(leaderboards) {
    let values = `('${leaderboards[0]}', 1)`;
    for(let i=1; i<leaderboards.length; i++) { values += `,('${leaderboards[i]}', ${i+1})`; }
    query = `UPDATE stock_pick AS t SET latest_rank = c.latest_rank FROM (VALUES ${values}) AS c(userid, latest_rank) WHERE c.userid=t.userid`;
    await config.pquery(query);
}

// CRYPTO PICK #1
module.exports.fetchCryptoPickUser = async function(userid) {
    let query = 'SELECT * FROM crypto_pick WHERE userid=$1';
    let cryptoPickUser = (await config.pquery(query, [userid]))[0];
    return cryptoPickUser;
}

module.exports.fetchCryptoPickUsers = async function() {
    let query = 'SELECT * FROM crypto_pick';
    let cryptoPickUsers = await config.pquery(query);
    return cryptoPickUsers;
}

module.exports.fetchCryptosPicked = async function() {
    let query = 'SELECT DISTINCT(pick) FROM crypto_pick';
    let cryptosPicked = await config.pquery(query);
    return cryptosPicked;
}

module.exports.fetchCryptosPicked2 = async function() {
    let query = 'SELECT DISTINCT(pick2) FROM crypto_pick';
    let cryptosPicked = await config.pquery(query);
    return cryptosPicked;
}

module.exports.fetchCryptosPicked3 = async function() {
    let query = 'SELECT DISTINCT(pick3) FROM crypto_pick';
    let cryptosPicked = await config.pquery(query);
    return cryptosPicked;
}

module.exports.setCryptoBuyPrices = async function(prices, x) {
    let firstValue = true, values = '';
    for(const[key, val] of Object.entries(prices)) {
        if(firstValue) { firstValue = false; }
        else { values += ','; }
        values += `('${key}', ${val.price})`;
    }
    console.log(values);
    query = `UPDATE crypto_pick AS t SET buy_price${x}=c.buy_price${x} FROM (VALUES ${values}) AS c(pick${x}, buy_price${x}) WHERE c.pick${x}=t.pick${x}`;
    await config.pquery(query);
}

module.exports.cryptoPickUpdateLatestRank = async function(leaderboards) {
    let values = `('${leaderboards[0]}', 1)`;
    for(let i=1; i<leaderboards.length; i++) { values += `,('${leaderboards[i]}', ${i+1})`; }
    query = `UPDATE crypto_pick AS t SET latest_rank = c.latest_rank FROM (VALUES ${values}) AS c(userid, latest_rank) WHERE c.userid=t.userid`;
    await config.pquery(query);
}