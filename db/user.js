const config = require('./config.js');

const calc = require('../lib/calc.js');
const datetime = require('../lib/datetime.js');
const gameLogic = require('../lib/gameLogic.js');

initialize = async function(userid) {
    const today = datetime.currentDayDashedString();
    let query = 'INSERT INTO users (userid, day_joined) VALUES ($1, $2) RETURNING *';
    let user = (await config.pquery(query, [userid, today]))[0];
    return user;
}
// functions start
// ____________________ GETTER ____________________
module.exports.fetchUser = async function(userid) {
    let query = 'SELECT * FROM users WHERE userid=$1';
    let user = (await config.pquery(query, [userid]))[0];
    if(!user) { user = await initialize(userid); }

    user.money = parseFloat(user.money);
    
    return user;
}

module.exports.onJoin = async function(userid) { // returns true if user is new, false if returning
    let query = 'SELECT id FROM users WHERE userid=$1';
    let user = (await config.pquery(query, [userid]))[0];
    if(!user) { await initialize(userid); }
    return user ? false : true;
}
// ____________________ SETTER ____________________
module.exports.initializeGameAccount = async function(userid) {
    let query = `UPDATE users SET money=20000, tutorial='buy' WHERE userid=$1`;
    await config.pquery(query, [userid]);
    return;
}
// ____________________ UPDATE ____________________
module.exports.addMoney = async function(user, amount) { // can also be used to deduct money, min at 0
    const money = Math.max(calc.round(user.money + amount, 8), 0);
    let query = 'UPDATE users SET money=$1 WHERE userid=$2';
    await config.pquery(query, [money, user.userid]);
    return;
}

module.exports.creditStock = async function(user, ticker, price, amount, paying=true) {
    let userStocks = await gameLogic.parseStock(user.stocks);
    if(Object.keys(userStocks).includes(ticker)) {
        let oldPrice = userStocks[ticker].buyPrice, oldAmount = userStocks[ticker].qt;
        let newInfo = {
            avgPrice: calc.round((price * amount + oldPrice * oldAmount) / (amount + oldAmount), 3),
            amount: amount + oldAmount,
            money: paying ? calc.round(user.money - price * amount, 8) : user.money
        };
        const oldData = `${ticker} ${oldAmount} ${oldPrice}`;
        const newData = `${ticker} ${newInfo.amount} ${newInfo.avgPrice}`;
        let query = 'UPDATE users SET stocks=ARRAY_REPLACE(stocks, $1, $2), money=$3, transactions=transactions+1 WHERE userid=$4';
        await config.pquery(query, [oldData, newData, newInfo.money, user.userid]);
    } else {
        let money = paying ? calc.round(user.money - price * amount, 8) : user.money;
        const newData = `${ticker} ${amount} ${calc.round(price, 3)}`;
        let query = 'UPDATE users SET stocks=ARRAY_APPEND(stocks, $1), money=$2, transactions=transactions+1 WHERE userid=$3';
        await config.pquery(query, [newData, money, user.userid]);
    }
    return;
}

module.exports.creditCrypto = async function(user, symbol, price, amount, paying=true) {
    let userCrypto = await gameLogic.parseCrypto(user.crypto);
    if(Object.keys(userCrypto).includes(symbol)) {
        let oldPrice = userCrypto[symbol].buyPrice, oldAmount = userCrypto[symbol].qt;
        let newInfo = {
            avgPrice: calc.round((price * amount + oldPrice * oldAmount) / (amount + oldAmount), 8),
            amount: calc.round(amount + oldAmount, 4),
            money: paying ? calc.round(user.money - price * amount, 8) : user.money
        };
        const oldData = `${symbol} ${oldAmount} ${oldPrice}`;
        const newData = `${symbol} ${newInfo.amount} ${newInfo.avgPrice}`;
        let query = 'UPDATE users SET crypto=ARRAY_REPLACE(crypto, $1, $2), money=$3, transactions=transactions+1 WHERE userid=$4';
        await config.pquery(query, [oldData, newData, newInfo.money, user.userid]);
    } else {
        let money = paying ? calc.round(user.money - price * amount, 8) : user.money;
        const newData = `${symbol} ${amount} ${price}`;
        let query = 'UPDATE users SET crypto=ARRAY_APPEND(crypto, $1), money=$2, transactions=transactions+1 WHERE userid=$3';
        await config.pquery(query, [newData, money, user.userid]);
    }
    return;
}

module.exports.removeStock = async function(user, ticker, stockValue, amount, payout=true) {
    let userStocks = await gameLogic.parseStock(user.stocks);
    const oldData = `${ticker} ${userStocks[ticker].qt} ${userStocks[ticker].buyPrice}`;
    const money = payout ? calc.round(user.money + stockValue * amount, 8) : user.money;
    if(amount >= userStocks[ticker].qt) {
        let query = 'UPDATE users SET stocks=ARRAY_REMOVE(stocks, $1), money=$2, transactions=transactions+1 WHERE userid=$3';
        await config.pquery(query, [oldData, money, user.userid]);
    } else {
        let newAmount = userStocks[ticker].qt - amount;
        const newData = `${ticker} ${newAmount} ${userStocks[ticker].buyPrice}`;
        let query = 'UPDATE users SET stocks=ARRAY_REPLACE(stocks, $1, $2), money=$3, transactions=transactions+1 WHERE userid=$4';
        await config.pquery(query, [oldData, newData, money, user.userid]);
    }
    return;
}

module.exports.removeCrypto = async function(user, symbol, cryptoValue, amount, payout=true) {
    let userCrypto = await gameLogic.parseCrypto(user.crypto);
    const oldData = `${symbol} ${userCrypto[symbol].qt} ${userCrypto[symbol].buyPrice}`;
    const money = payout ? calc.round(user.money + cryptoValue * amount, 8) : user.money;
    if(amount >= userCrypto[symbol].qt) {
        let query = 'UPDATE users SET crypto=ARRAY_REMOVE(crypto, $1), money=$2, transactions=transactions+1 WHERE userid=$3';
        await config.pquery(query, [oldData, money, user.userid]);
    } else {
        let newAmount = userCrypto[symbol].qt - amount;
        const newData = `${symbol} ${newAmount} ${userCrypto[symbol].buyPrice}`;
        let query = 'UPDATE users SET crypto=ARRAY_REPLACE(crypto, $1, $2), money=$3, transactions=transactions+1 WHERE userid=$4';
        await config.pquery(query, [oldData, newData, money, user.userid]);
    }
    return;
}

module.exports.alterStockOrder = async function(user, ticker, amount) {
    let orders = await gameLogic.parseOrders(user.stock_orders);
    if(!Object.keys(orders).includes(ticker)) {
        const newData = `${ticker} ${amount}`;
        let query = 'UPDATE users SET stock_orders=ARRAY_APPEND(stock_orders, $1) WHERE userid=$2';
        await config.pquery(query, [newData, user.userid]);
    } else {
        const oldData = `${ticker} ${orders[ticker]}`;
        if(orders[ticker] === -amount) { // cancels out
            let query = 'UPDATE users SET stock_orders = ARRAY_REMOVE(stock_orders, $1) WHERE userid=$2';
            await config.pquery(query, [oldData, user.userid]);
        } else {
            const newData = `${ticker} ${orders[ticker] + amount}`;
            let query = 'UPDATE users SET stock_orders = ARRAY_REPLACE(stock_orders, $1, $2) WHERE userid=$3';
            await config.pquery(query, [oldData, newData, user.userid]);
        }
    }
    return;
}

module.exports.addSavings = async function(user, amount) {
    let savingsBalance = 0;
    if(user.savings) { savingsBalance = gameLogic.parseSavings(user.savings); }
    let newBalance = calc.round(savingsBalance + amount, 8);
    let newDepositTime = datetime.getEpochHoursEST() + 1;
    const newData = `${newBalance} ${newDepositTime}`;
    const money = calc.round(user.money - amount, 8);
    let query = 'UPDATE users SET savings=$1, money=$2 WHERE userid=$3';
    await config.pquery(query, [newData, money, user.userid]);
    return;
}

module.exports.takeSavings = async function(user, amount) {
    let savingsBalance = gameLogic.parseSavings(user.savings);
    let newBalance = calc.round(savingsBalance - amount, 8);
    let newDepositTime = datetime.getEpochHoursEST() + 1;
    const newData = newBalance === 0 ? null : `${newBalance} ${newDepositTime}`;
    const money = calc.round(user.money + amount, 8);
    let query = 'UPDATE users SET savings=$1, money=$2 WHERE userid=$3';
    await config.pquery(query, [newData, money, user.userid]);
    return;
}

module.exports.setDailyToCollected = async function(user, day) {
    let query = 'UPDATE users SET daily=$1 WHERE userid=$2';
    await config.pquery(query, [day, user.userid]);
    return;
}

module.exports.alterTutorial = async function(userid, newStage) {
    let query = 'UPDATE users SET tutorial=$1 WHERE userid=$2';
    await config.pquery(query, [newStage, userid]);
    return;
}