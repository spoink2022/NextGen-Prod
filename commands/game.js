const config = require('../private/config.json');

const create = require('../create');
const db = require('../db');
const endpoints = require('../endpoints');
const analytics = require('../lib/trackers/analytics.js');
const awaitReactions = require('../lib/trackers/awaitReactions.js');
const calc = require('../lib/calc.js');
const datetime = require('../lib/datetime.js');
const format = require('../lib/format.js');
const gameLogic = require('../lib/gameLogic.js');
const tutorial = require('../lib/tutorial.js');

const commands = require('../static').commands.game;

module.exports.contains = function(cmd) {
    return Object.keys(commands).includes(cmd) || Object.values(commands).flat(1).includes(cmd);
}

module.exports.run = async function(cmd, args, msg) {
    let user = await db.user.fetchUser(msg.author.id);
    if(cmdIs(cmd, 'init')) {
        sendInit(msg, user);
    } else if(user.tutorial === 'init') {
        msg.reply('**No Account**\nYou don\'t have an account yet! Create one with `' + config.prefix + 'init`');
        return;
    }
    
    if(cmdIs(cmd, 'balance')) {
        sendBalance(msg, user);
    } else if(cmdIs(cmd, 'buy')) {
        sendBuy(msg, args, user);
    } else if(cmdIs(cmd, 'sell')) {
        sendSell(msg, args, user);
    } else if(cmdIs(cmd, 'list')) {
        sendList(msg, args, user);
    } else if(cmdIs(cmd, 'addsavings')) {
        sendAddSavings(msg, args, user);
    } else if(cmdIs(cmd, 'takesavings')) {
        sendTakeSavings(msg, args, user); 
    } else if(cmdIs(cmd, 'savings')) {
        sendSavings(msg, user);
    } else if(cmdIs(cmd, 'daily')) {
        sendDaily(msg, user);
    }
}

function cmdIs(given, toCheck) {
    return given === toCheck || commands[toCheck].includes(given);
}

// ________________________________________ FUNCTIONS ________________________________________
/*
- sendInit
- sendBalance
- sendList
*/
async function sendInit(msg, user) {
    if(user.tutorial !== 'init') { msg.reply('You already have an account!'); return; }
    await db.user.initializeGameAccount(msg.author.id);
    const embed = await create.embed.titleOnly('Successfully Created Account!', msg.author, 'success');
    await msg.channel.send(embed);
    tutorial.recommendBuy(msg);
}

async function sendBalance(msg, user) {
    const money = user.money;
    let embed = await create.embed.balance(msg.author, money, 'calculating...');
    let sentEmbed = await msg.channel.send(embed);
    if(user.tutorial === 'balance') { tutorial.recommendSell(msg); }

    const netWorth = await gameLogic.getNetWorth(user);
    embed = await create.embed.balance(msg.author, money, netWorth);
    sentEmbed.edit(embed);
}

// -------------------- BUY: START --------------------
async function sendBuy(msg, args, user) {
    if(args.length < 3) { // not enough arguments
        msg.reply('**Missing Key Info**\nThe parameters of the command `buy <type> <symbol> <amount>` were not fulfilled!'); return;
    }
    let type = args[0];
    let symbol = args[1];
    let amount = args[2];
    if(type === 'stock') {
        buyStock(msg, symbol, amount, user);
    } else if(type === 'crypto') {
        buyCrypto(msg, symbol.toUpperCase(), amount, user);
    } else { // invalid type
        msg.reply(`**Invalid Type**\n\`${type}\` is not a valid parameter\nThe command \`buy <type> <symbol> <amount>\` expects one of \`stock\`, \`crypto\` for <type>`); return;
    }
}

async function buyStock(msg, ticker, amount, user) {
    if(!Number.isInteger(parseFloat(amount)) || parseInt(amount) <= 0) { // amount not integer in range 1+
        msg.reply(`**Invalid Amount**\n\`${amount}\` is not a valid parameter\nA positive, non-zero integer was expected for <amount>`); return;
    }
    amount = parseInt(amount);
    let stockQuote = await endpoints.stock.getQuote(ticker);
    if(!stockQuote) { // invalid ticker
        msg.reply(`**Stock Not Found**\n\`${ticker.toUpperCase()}\` is not a valid ticker value!`); return;
    }
    if(!stockQuote.marketcap || stockQuote.marketcap < config.minMarketcap) { // too small of a stock
        msg.reply(`**Marketcap Too Small**\nTo be traded in this game, stocks must have a market cap of at least ${format.dollarValue(config.minMarketcap, 0)}`); return;
    }
    if(!datetime.isMarketOpen()) { // market closed
        preOrderStock(msg, ticker, amount, user); return;
    }
    let stockPrice = stockQuote.price;
    let totalPrice = calc.round(stockPrice * amount, 8);
    if(totalPrice > user.money) { // can't afford buy
        msg.reply(`**Not Enough Money**\nBuying ${format.intValue(amount)} ${ticker.toUpperCase()} share${amount===1 ? '' : 's'} costs ` +
        `**${format.dollarValue(totalPrice, 2)}** but you only have **${format.dollarValue(user.money, 2)}**!`); return;
    }
    let text = {
        ask: `Buy ${format.intValue(amount)} ${ticker.toUpperCase()} share${amount===1 ? '' : 's'} for ${format.dollarValue(totalPrice, 2)}?`,
        reject: 'Cancelled!',
        processing: `Processing...`,
        confirm: `Success, bought ${format.intValue(amount)} ${ticker.toUpperCase()} share${amount===1 ? '' : 's'} at ${format.dollarValue(stockPrice, 2)}/share!`
    };
    let eligible = awaitReactions.add(msg.author.id);
    if(!eligible) { // pending reaction from previous request
        msg.reply('**Pending Reaction**\nPlease resolve previous request (or wait for it to timeout)'); return;
    }
    create.embed.ask(msg, text, async function(confirmed) {
        if(confirmed) {
            if(user.tutorial === 'buy') { tutorial.recommendList(msg); }
            analytics.increment('transactions');
            await db.user.creditStock(user, ticker.toUpperCase(), stockPrice, amount, paying=true);
        }
        awaitReactions.remove(msg.author.id);
    });
}

async function preOrderStock(msg, ticker, amount, user) {
    let text = {
        ask: `Preorder ${format.intValue(amount)} ${ticker.toUpperCase()} share${amount===1 ? '' : 's'}?`,
        reject: 'Cancelled!',
        processing: `Processing...`,
        confirm: `Success, preordered ${format.intValue(amount)} ${ticker.toUpperCase()} share${amount===1 ? '' : 's'}!`
    };
    create.embed.ask(msg, text, async function(confirmed) {
        if(confirmed) {
            if(user.tutorial === 'buy') { tutorial.recommendList(msg, ticker.toUpperCase()); }
            await db.user.alterStockOrder(user, ticker.toUpperCase(), amount);
        }
    });
}

async function buyCrypto(msg, symbol, amount, user) {
    let tmp = calc.round(parseFloat(amount), 4);
    if(isNaN(tmp) || tmp <= 0) { // either NaN or invalid number
        msg.reply(`**Invalid Amount**\n\`${amount}\` is not a valid parameter\nA positive, non-zero number was expected for <amount>`); return;
    }
    amount = tmp;
    let cryptoQuote = await endpoints.crypto.getQuote(symbol);
    if(!cryptoQuote) { // invalid symbol
        msg.reply(`**Cryptocurrency Not Found**\n\`${symbol}\` is not a valid cryptocurrency!`); return;
    }
    let cryptoPrice = cryptoQuote.price;
    let totalPrice = calc.round(cryptoPrice * amount, 8);
    if(totalPrice > user.money) { // can't afford buy
        msg.reply(`**Not Enough Money**\nBuying ${format.floatValue(amount, 4)} ${symbol} costs ` +
        `**${format.dollarValue(totalPrice, 2)}** but you only have **${format.dollarValue(user.money, 2)}**!`); return;
    }
    let text = {
        ask: `Buy ${format.floatValue(amount, 4)} ${symbol} for ${format.dollarValue(totalPrice, 8)}?`,
        reject: 'Cancelled!',
        processing: 'Processing...',
        confirm: `Success, bought ${format.floatValue(amount, 4)} ${symbol} at ${format.dollarValue(cryptoPrice, 8)}/unit!`
    }
    create.embed.ask(msg, text, async function(confirmed) {
        if(confirmed) {
            await db.user.creditCrypto(user, symbol, cryptoPrice, amount, paying=true);
            analytics.increment('transactions');
        }
        awaitReactions.remove(msg.author.id);
    });
}
// ____________________ BUY: END ____________________
// -------------------- SELL: START --------------------
async function sendSell(msg, args, user) {
    if(args.length < 3) { // not enough arguments
        msg.reply('**Missing Key Info**\nThe parameters of the command `sell <type> <symbol> <amount>` were not fulfilled!'); return;
    }
    let type = args[0];
    let symbol = args[1];
    let amount = args[2];
    if(type === 'stock') {
        sellStock(msg, symbol.toUpperCase(), amount, user);
    } else if(type === 'crypto') {
        sellCrypto(msg, symbol.toUpperCase(), amount, user);
    } else { // invalid type
        msg.reply(`**Invalid Type**\n\`${type}\` is not a valid parameter\nThe command \`sell <type> <symbol> <amount>\` expects one of \`stock\`, \`crypto\` for <type>`); return;
    }
}

async function sellStock(msg, ticker, amount, user) {
    if(amount !== 'all' && (!Number.isInteger(parseFloat(amount)) || parseInt(amount) <= 0)) { // amount not integer in range 1+
        msg.reply(`**Invalid Amount**\n\`${amount}\` is not a valid parameter\nA positive, non-zero integer (or the value "all") was expected for <amount>`); return;
    }
    let stockQuote = await endpoints.stock.getQuote(ticker);
    if(!stockQuote) { // invalid ticker
        msg.reply(`**Stock Not Found**\n\`${ticker.toUpperCase()}\` is not a valid ticker value!`); return;
    }
    if(!datetime.isMarketOpen()) { // market closed
        preSellStock(msg, ticker, amount, user); return;
    }
    let stocks = await gameLogic.parseStock(user.stocks);
    if(!Object.keys(stocks).includes(ticker)) { // has no stocks of that kind
        msg.reply(`**Stock Not Owned**\nYou don't have any ${ticker} shares!`); return;
    }
    amount = amount==='all' ? stocks[ticker].qt : parseInt(amount);
    if(stocks[ticker].qt < amount) { // not enough stocks
        msg.reply(`**Not Enough Inventory**\nYou are trying to sell **${amount}** shares of ${ticker}, but you only have **${stocks[ticker].qt}**!`); return;
    }
    let stockValue = stockQuote.price;
    let totalValue = calc.round(stockValue * amount, 8);
    let text = {
        ask: `Sell ${format.intValue(amount)} ${ticker.toUpperCase()} share${amount===1 ? '' : 's'} for ${format.dollarValue(totalValue, 2)}?`,
        reject: 'Cancelled!',
        processing: `Processing...`,
        confirm: `Success, sold ${format.intValue(amount)} ${ticker.toUpperCase()} share${amount===1 ? '' : 's'} at ${format.dollarValue(stockValue, 2)}/share!`
    };
    let eligible = awaitReactions.add(msg.author.id);
    if(!eligible) { // pending reaction from previous request
        msg.reply('**Pending Reaction**\nPlease resolve previous request (or wait for it to timeout)'); return;
    }
    create.embed.ask(msg, text, async function(confirmed) {
        if(confirmed) {
            if(user.tutorial === 'sell') { tutorial.recommendDaily(msg); }
            await db.user.removeStock(user, ticker, stockValue, amount, payout=true);
            analytics.increment('transactions');
        }
        awaitReactions.remove(msg.author.id);
    });
}

async function preSellStock(msg, ticker, amount, user) {
    if(amount === 'all') { // can't presell all
    msg.reply(`**Can't Presell All**\nDue to conflicts, the value "all" can't be used with the \`sell\` command when the market is closed`); return;
    }
    let text = {
        ask: `Presell ${format.intValue(amount)} ${ticker.toUpperCase()} share${amount===1 ? '' : 's'}?`,
        reject: 'Cancelled!',
        processing: `Processing...`,
        confirm: `Success, presold ${format.intValue(amount)} ${ticker.toUpperCase()} share${amount===1 ? '' : 's'}!`
    };
    create.embed.ask(msg, text, async function(confirmed) {
        if(confirmed) {
            if(user.tutorial === 'sell') { tutorial.recommendDaily(msg); }
            await db.user.alterStockOrder(user, ticker.toUpperCase(), -amount);
        }
    });
}

async function sellCrypto(msg, symbol, amount, user) {
    if(amount !== 'all' && (isNaN(parseFloat(amount)) || calc.round(parseFloat(amount), 4) <= 0)) { // either NaN or invalid number
        msg.reply(`**Invalid Amount**\n\`${amount}\` is not a valid parameter\nA positive, non-zero number (to the 4th decimal place) was expected for <amount>`); return;
    }
    let cryptoQuote = await endpoints.crypto.getQuote(symbol);
    if(!cryptoQuote) { // invalid symbol
        msg.reply(`**Cryptocurrency Not Found**\n\`${symbol}\` is not a valid cryptocurrency!`); return;
    }
    let crypto = await gameLogic.parseCrypto(user.crypto);
    if(!Object.keys(crypto).includes(symbol)) { // has no crypto of that kind
        msg.reply(`**Crypto Not Owned**\nYou don't have any ${symbol}!`); return;
    }
    amount = amount==='all' ? crypto[symbol].qt : calc.round(parseFloat(amount), 4);
    if(crypto[symbol].qt < amount) { // not enough crypto
        msg.reply(`**Not Enough Inventory**\nYou are trying to sell **${amount}** ${symbol}, but you only have **${crypto[symbol].qt}**!`); return;
    }
    let cryptoValue = cryptoQuote.price;
    let totalValue = calc.round(cryptoValue * amount, 8);
    let text = {
        ask: `Sell ${format.floatValue(amount, 4)} ${symbol.toUpperCase()} for ${format.dollarValue(totalValue, 8)}?`,
        reject: 'Cancelled!',
        processing: `Processing...`,
        confirm: `Success, sold ${format.intValue(amount)} ${symbol.toUpperCase()} at ${format.dollarValue(cryptoValue, 8)}/unit!`
    }
    let eligible = awaitReactions.add(msg.author.id);
    if(!eligible) { // pending reaction from previous request
        msg.reply('**Pending Reaction**\nPlease resolve previous request (or wait for it to timeout)'); return;
    }
    create.embed.ask(msg, text, async function(confirmed) {
        if(confirmed) {
            await db.user.removeCrypto(user, symbol, cryptoValue, amount, payout=true);
            analytics.increment('transactions');
        }
        awaitReactions.remove(msg.author.id);
    });
}
// ____________________ SELL: END ____________________
// -------------------- LIST: START --------------------
async function sendList(msg, args, user) {
    let toList = args[0], page = args[1] || 1;
    if(!toList) { // didn't specify what to list
        msg.reply('**Type Not Provided**\nThe command `list <type>` expects a value such as "stock" for `<type>`'); return;
    }
    if(!Number.isInteger(parseFloat(page)) || parseInt(page) < 1) { // Invalid Page Number
        msg.reply('**Invalid Page Number**\nPage numbers must be a positive, non-zero integer'); return;
    }
    page = parseInt(page);
    if((toList==='stock' && user.stocks.length<(page-1)*10) || (toList==='crypto' && user.crypto.length<(page-1)*10)) { // page number too high
        msg.reply('**Page Number Too High**\nNote that each page shows 10 items'); return;
    }
    if(['stock', 'stocks', 's', 'stonks', 'stonk'].includes(toList)) {
        sendListStock(msg, page, user);
    } else if(['crypto', 'cryptocurrency', 'cryptos', 'c'].includes(toList)) {
        sendListCrypto(msg, page, user);
    } else if(['orders', 'order', 'o'].includes(toList)) {
        sendListOrders(msg, user);
    } else if(toList === 'all') {
        await sendListStock(msg, page, user);
        await sendListCrypto(msg, page, user);
        await sendListOrders(msg, user);
        if(user.tutorial === 'list') { tutorial.recommendBalance(msg); }
    } else { // invalid category to list
        msg.reply(`**Invalid Type**\n\`${toList}\` is not something that can be listed!`);
        return;
    }
}

async function sendListStock(msg, page, user) {
    let stocks = {};
    for(let i=(page-1)*10; i<Math.min(page*10, user.stocks.length); i++) {
        let stockEntry = user.stocks[i].split(' ');
        if(stockEntry.length === 3) { stocks[stockEntry[0]] = {type: 'BUY', qt: parseInt(stockEntry[1]), buyPrice: parseFloat(stockEntry[2])}; }
    }
    let prices = await endpoints.stock.getPrices(Object.keys(stocks));
    for(const[key, val] of Object.entries(prices)) {
        stocks[key].price = val.price;
        stocks[key].companyName = val.companyName;
        stocks[key].change = calc.dollarChange(stocks[key].buyPrice, stocks[key].price, stocks[key].qt);
        stocks[key].changePct = calc.percentChange(stocks[key].buyPrice, stocks[key].price);
    }
    const maxPage = Math.ceil(user.stocks.length / 10);
    const embed = await create.embed.listStock(msg.author, stocks, page, maxPage);
    await msg.channel.send(embed);
}

async function sendListCrypto(msg, page, user) {
    let crypto = {};
    for(let i=(page-1)*10; i<Math.min(page*10, user.crypto.length); i++) {
        let cryptoEntry = user.crypto[i].split(' ');
        if(cryptoEntry.length === 3) { crypto[cryptoEntry[0]] = {type: 'BUY', qt: parseFloat(cryptoEntry[1]), buyPrice: parseFloat(cryptoEntry[2])}; }
    }
    let prices = await endpoints.crypto.getPrices(Object.keys(crypto));
    for(const[key, val] of Object.entries(prices)) {
        crypto[key].price = val.price;
        crypto[key].name = val.name;
        crypto[key].change = calc.dollarChange(crypto[key].buyPrice, crypto[key].price, crypto[key].qt);
        crypto[key].changePct = calc.percentChange(crypto[key].buyPrice, crypto[key].price);
    }
    const maxPage = Math.ceil(user.crypto.length / 10);
    const embed = await create.embed.listCrypto(msg.author, crypto, page, maxPage);
    msg.channel.send(embed);
}

async function sendListOrders(msg, user) {
    let orders = await gameLogic.parseOrders(user.stock_orders);
    const embed = await create.embed.listOrders(msg.author, orders);
    msg.channel.send(embed);
}
// ____________________ LIST: END ____________________
// -------------------- SAVINGS-MULTI: START --------------------
async function sendAddSavings(msg, args, user) {
    let amount = args[0];
    if(!amount) { // value not provided for amount
        msg.reply('**Amount Not Provided**\nThe command `addsavings <amount>` did not receive a value for <amount>'); return;
    }
    if(amount !== 'all' && (isNaN(parseFloat(amount)) || calc.round(parseFloat(amount), 8) <= 0)) { // NaN or invalid number
        msg.reply(`**Invalid Amount**\n\`${amount}\` is not a valid parameter\nA positive, non-zero number (rounded to the 8th decimal place) was expected for <amount>`); return;
    }
    amount = amount==='all' ? user.money : calc.round(parseFloat(amount), 8);
    if(amount > user.money) { // not enough money
        msg.reply(`**Not Enough Money**\nYou're trying to deposit **${format.dollarValue(amount, 8)}** but you only have **${format.dollarValue(user.money, 8)}**!`); return;
    }
    await db.user.addSavings(user, amount);
    const embed = await create.embed.titleOnly(`Success, you deposited ${format.dollarValue(amount, 4)} into your savings account!`, msg.author, 'savings');
    msg.channel.send(embed);
}

async function sendTakeSavings(msg, args, user) {
    let amount = args[0];
    if(!amount) { // value not provided for amount
        msg.reply('**Amount Not Provided**\nThe command `takesavings <amount>` did not receive a value for <amount>'); return;
    }
    if(amount !== 'all' && (isNaN(parseFloat(amount)) || calc.round(parseFloat(amount), 8) <= 0)) { // NaN or invalid number
        msg.reply(`**Invalid Amount**\n\`${amount}\` is not a valid parameter\nA positive, non-zero number (rounded to the 8th decimal place) was expected for <amount>`); return;
    }
    const savingsBalance = await gameLogic.parseSavings(user.savings);
    amount = amount==='all' ? savingsBalance : calc.round(parseFloat(amount), 8);
    if(amount > savingsBalance) { // not enough money
        msg.reply(`**Not Enough Funds**\nYou're trying to withdraw **${format.dollarValue(amount, 8)}** but you only have **${format.dollarValue(savingsBalance, 8)}** in your savings account!`); return;
    }
    await db.user.takeSavings(user, amount);
    const embed = await create.embed.titleOnly(`Success, you withdrew ${format.dollarValue(amount, 4)} from your savings account!`, msg.author, 'savings');
    msg.channel.send(embed);
}

async function sendSavings(msg, user) {
    if(!user.savings) {
        var embed = await create.embed.titleOnly(`Your savings account is empty!`, msg.author, 'savings');
    } else {
        const newBalance = gameLogic.parseSavings(user.savings);
        var embed = await create.embed.savings(msg.author, {
            oldBalance: parseFloat(user.savings.split(' ')[0]),
            newBalance: newBalance,
            change: calc.dollarChange(parseFloat(user.savings.split(' ')[0]), newBalance),
            changePct: calc.percentChange(parseFloat(user.savings.split(' ')[0]), newBalance),
            lastDeposit: datetime.epochToDateString(parseInt(user.savings.split(' ')[1])*1000*60*60, year=true)
        });
    }
    msg.channel.send(embed);
}
// ____________________ SAVINGS-MULTI: END ____________________
async function sendDaily(msg, user) {
    const today = datetime.currentDayDashedString();
    if(today === user.daily) { // already collected reward
        await msg.reply(`**Reward Already Collected**\nCome back tomorrow for tomorrow's reward!`);
        if(user.tutorial === 'daily') { tutorial.complete(msg); }
        return;
    }
    const reward = await db.server.getDaily(today);
    await db.user.setDailyToCollected(user, today);
    analytics.increment('daily');
    let text = 'You collected your daily reward of ';
    if(reward.type === 'cash') {
        await db.user.addMoney(user, parseFloat(reward.data));
        text += `**${format.dollarValue(parseFloat(reward.data), 2)}**!`;
    } else if(reward.type === 'stock') {
        let ticker = reward.data.split(' ')[0], amount = parseInt(reward.data.split(' ')[1]);
        let quote = await endpoints.stock.getQuote(ticker);
        await db.user.creditStock(user, ticker, quote.price, amount, paying=false);
        text += `**${format.intValue(amount)} ${ticker} share${amount>1 ? 's' : ''}**!`;
    } else if(reward.type === 'crypto') {
        let symbol = reward.data.split(' ')[0], amount = parseFloat(reward.data.split(' ')[1]);
        let quote = await endpoints.crypto.getQuote(symbol);
        await db.user.creditCrypto(user, symbol, quote.price, amount, paying=false);
        text += `**${format.intValue(amount)} ${symbol}**!`;
    }
    const embed = await create.embed.titleOnly(text, msg.author, 'daily');
    await msg.channel.send(embed);
    if(user.tutorial === 'daily') { tutorial.complete(msg); }
}