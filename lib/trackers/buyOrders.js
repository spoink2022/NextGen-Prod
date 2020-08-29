const db = require('../../db');
const endpoints = require('../../endpoints');

const analytics = require('./analytics.js');
const calc = require('../calc.js');
const datetime = require('../datetime.js');
const gameLogic = require('../gameLogic.js');

var ordersCompletedToday = false;

async function orderAll() {
    let users = await db.server.fetchUsersWithOrders();
    for(user of users) {
        handleBuyOrders(user);
    }
    db.server.clearOrders();
}
module.exports.orderAll = orderAll;

module.exports.tryBuyOrders = async function() {
    if(!ordersCompletedToday && datetime.canHandleBuyOrders()) {
        const startTime = Date.now();
        await orderAll();
        ordersCompletedToday = true;
        console.log(`Handled Buy Orders! - ${Date.now() - startTime}ms`);
    } else if(ordersCompletedToday && !datetime.canHandleBuyOrders()) {
        ordersCompletedToday = false;
        console.log('Buy Orders - Market Closed');
    }
}

async function handleBuyOrders(user) {
    const orders = await gameLogic.parseOrders(user.stock_orders);
    const stocks = await gameLogic.parseStock(user.stocks);
    const prices = await endpoints.stock.getPrices(Object.keys(orders));
    user.money = parseFloat(user.money);
    for(const[key, val] of Object.entries(orders)) {
        if(val > 0) { // buy
            let price = parseFloat(prices[key].price);
            let amount = parseInt(val);
            if(user.money < calc.round(price * amount, 8)) { // can't afford
                return;
            }
            analytics.increment('transactions');
            await db.user.creditStock(user, key, price, amount, paying=true);
            user.money = calc.round(user.money - price * amount, 8);
        } else { // sell
            let price = parseFloat(prices[key].price);
            let amount = -parseInt(val);
            if(!stocks[key] || stocks[key].qt < amount) { // no stocks/not enough stock
                return;
            }
            analytics.increment('transactions');
            await db.user.removeStock(user, key, price, amount, payout=true);
            user.money = calc.round(user.money + price * amount, 8);
        }
    }
}