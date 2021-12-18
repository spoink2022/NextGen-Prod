const config = require('../private/config.json');
const endpoints = require('../endpoints');
const calc = require('../lib/calc.js');
const datetime = require('../lib/datetime.js');

module.exports.getNetWorth = async function(user) {
    let money = user.money;
    let stockWorth = user.stocks.length === 0 ? 0 : await getStockWorth(user.stocks);
    let cryptoWorth = user.crypto.length === 0 ? 0 : await getCryptoWorth(user.crypto);
    let savingsWorth = user.savings ? await this.parseSavings(user.savings) : 0;
    const netWorth = money + stockWorth + cryptoWorth + savingsWorth;
    return netWorth;
}

async function getStockWorth(stocks) {
    let obj = {}, stockWorth = 0;
    for(let stockEntry of stocks) { obj[stockEntry.split(' ')[0]] = parseInt(stockEntry.split(' ')[1]); }
    let prices = await endpoints.stock.getPrices(Object.keys(obj));
    console.log(prices);
    for(const[key, val] of Object.entries(obj)) {
        stockWorth += prices[key].price * val;
    }
    return stockWorth;
}

async function getCryptoWorth(crypto) {
    let obj = {}, cryptoWorth = 0;
    for(let cryptoEntry of crypto) { obj[cryptoEntry.split(' ')[0]] = parseFloat(cryptoEntry.split(' ')[1]); }
    let prices = await endpoints.crypto.getPrices(Object.keys(obj));
    for(const[key, val] of Object.entries(obj)) { cryptoWorth += prices[key] ? prices[key].price * val : 0; }
    return cryptoWorth;
}

module.exports.parseStock = function(stocks) {
    let res = {};
    for(const entry of stocks) {
        let d = entry.split(' ');
        res[d[0]] = {qt: parseInt(d[1]), buyPrice: parseFloat(d[2])};
    }
    return res;
}

module.exports.parseCrypto = function(crypto) {
    let res = {};
    for(const entry of crypto) {
        let d = entry.split(' ');
        res[d[0]] = {qt: parseFloat(d[1]), buyPrice: parseFloat(d[2])};
    }
    return res;
}

module.exports.parseSavings = function(savings) {
    let initialBalance = parseFloat(savings.split(' ')[0]);
    let buyTime = parseInt(savings.split(' ')[1]);
    let hoursElapsed = datetime.getEpochHoursEST() - buyTime;
    const newBalance = calc.round(initialBalance * Math.pow(1+config.savingsInterest, hoursElapsed), 8);
    return Math.max(newBalance, parseFloat(savings.split(' ')[0]));
}

module.exports.parseOrders = function(orders) {
    let res = {};
    for(const entry of orders) {
        let d = entry.split(' ');
        res[d[0]] = parseInt(d[1]);
    }
    return res;
}