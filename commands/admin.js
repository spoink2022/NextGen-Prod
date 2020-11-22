const create = require('../create');
const db = require('../db');
const endpoints = require('../endpoints');
const config = require('../private/config.json');
const analytics = require('../lib/trackers/analytics.js');
const buyOrders = require('../lib/trackers/buyOrders.js');
const calc = require('../lib/calc.js');
const datetime = require('../lib/datetime.js');
const gameLogic = require('../lib/gameLogic.js');

const commands = require('../static').commands.admin;

module.exports.contains = function(cmd) {
    return Object.keys(commands).includes(cmd) || Object.values(commands).flat(1).includes(cmd);
}

module.exports.run = function(cmd, args, msg) {
    if(!config.mods.includes(msg.author.id)) { return; }
    
    if(cmdIs(cmd, 'test')) {
        sendTest(msg, args);
    } else if(cmdIs(cmd, 'test2')) {
        sendTest2(msg, args);
    } else if(cmdIs(cmd, 'analytics')) {
        sendAnalytics(msg);
    } else if(cmdIs(cmd, 'getdaily')) {
        sendGetDaily(msg, args);
    } else if(cmdIs(cmd, 'setdaily')) {
        sendSetDaily(msg, args);
    } else if(cmdIs(cmd, 'leaderboards')) {
        this.sendLeaderboards(msg);
    } /*else if(cmdIs(cmd, 'stockpick.setbuyprices')) {
        this.stockPick.setBuyPrices(msg);
    } else if(cmdIs(cmd, 'stockpick.leaderboards')) {
        this.stockPick.sendLeaderboards(msg);
    }*/else if(cmdIs(cmd, 'cryptopick.setbuyprices')) {
        this.cryptoPick.setBuyPrices(msg);
    } else if(cmdIs(cmd, 'cryptopick.leaderboards')) {
        this.cryptoPick.sendLeaderboards(msg);
    }
}

function cmdIs(given, toCheck) {
    return given === toCheck || commands[toCheck].includes(given);
}

async function sendTest(msg, args) {
    buyOrders.all();
}

async function sendTest2(msg, args) {
    console.log(datetime.isMarketOpen());
}
// ________________________________________ FUNCTIONS ________________________________________
async function sendAnalytics(msg) {
    let a = await analytics.fetch();
    const embed = await create.adminEmbed.analytics(a);
    msg.channel.send(embed);
}

async function sendGetDaily(msg, args) {
    const today = await datetime.currentDayDashedString();
    let foresight = Math.min(parseInt(args[0]) || 1, 25); // discord embeds can't have more than 25 fields
    const rewards = await db.server.getDailyMultiple(today, foresight);
    const embed = await create.adminEmbed.getDaily(rewards);
    msg.channel.send(embed);
}

async function sendSetDaily(msg, args) {
    if(args.length < 3) { // not enough args
        msg.reply('**Not Enough Args**'); return;
    }
    let day = args[0], type = args[1], value;
    if(type === 'cash') { value = args[2]; }
    else if(['stock', 'crypto'].includes(type)) { value = `${args[2].toUpperCase()} ${args[3]}`; }
    else { msg.reply('**Expected one of: [cash, stock, crypto]**'); return; }
    await db.server.setDaily(day, type, value);
    msg.reply(`Success! Set ${day} as "${type}" "${value}"`);
}

module.exports.sendLeaderboards = async function(msg, channelId=null) {
    const guild = await globals.client.guilds.fetch(config.nextgenServer);
    const users = await db.server.fetchUsersWithAccounts();
    let allRankings = [];
    for(user of users) {
        if(config.mods.includes(user.userid)) { continue; } // no mods in leaderboards
        user.money = parseFloat(user.money);
        allRankings.push({
            userid: user.userid,
            netWorth: await gameLogic.getNetWorth(user)
        });
    }
    allRankings.sort((a, b) => a.netWorth > b.netWorth ? -1 : 1);
    let TO_SHOW = 3, leaderboards = [];
    for(user of allRankings) {
        try { var guildMember = (await guild.members.fetch(user.userid)); }
        catch { continue; } // member not in guild
        user.nickname = guildMember.nickname || guildMember.user.username;
        user.name = guildMember.user.tag;
        leaderboards.push(user);
    }
    db.server.updateLatestRank(leaderboards.map(a => a.userid));
    const embed = await create.adminEmbed.leaderboards(leaderboards.splice(0, TO_SHOW));
    const channel = channelId ? await guild.channels.resolve(channelId) : msg.mentions.channels.first() || msg.channel;
    channel.send('<@&730168677290344481>', embed);
    //channel.send(embed);
}

// _____________________________ EVENT FUNCTIONS _________________________________
module.exports.stockPick = {};
module.exports.stockPick.setBuyPrices = async function(msg) { // & company name
    let stocksPicked = (await db.event.fetchStocksPicked()).map(obj => obj.pick);
    let prices = await endpoints.stock.getPrices(stocksPicked);
    await db.event.setBuyPrices(prices);
    let stocksPicked2 = (await db.event.fetchStocksPicked2()).map(obj => obj.pick2);
    let prices2 = await endpoints.stock.getPrices(stocksPicked2);
    await db.event.setBuyPrices2(prices2);
    msg.reply('set buy prices');
}

module.exports.stockPick.sendLeaderboards = async function(msg) {
    const guild = await globals.client.guilds.fetch(config.nextgenServer);
    const users = await db.event.fetchStockPickUsers();
    let stocksPicked = [], allRankings = [];
    for(const user of users) {
        if(!stocksPicked[user.pick]) { stocksPicked.push(user.pick); }
        if(!stocksPicked[user.pick2]) { stocksPicked.push(user.pick2); }
    }
    const prices = await endpoints.stock.getPrices(stocksPicked);
    for(const user of users) {
        allRankings.push({
            userid: user.userid,
            pick: user.pick,
            pick2: user.pick2,
            percentageGain: calc.percentChange(parseFloat(user.buy_price), prices[user.pick].price),
            percentageGain2: calc.percentChange(parseFloat(user.buy_price2), prices[user.pick2].price)
        });
    }
    allRankings.sort((a, b) => a.percentageGain+a.percentageGain2 > b.percentageGain+b.percentageGain2 ? -1 : 1);
    let TO_SHOW = 3, leaderboards = [];
    for(user of allRankings) {
        try { var guildMember = (await guild.members.fetch(user.userid)); }
        catch { continue; } // member not in guild
        user.name = guildMember.user.tag;
        leaderboards.push(user);
    }
    db.event.updateLatestRank(leaderboards.map(a => a.userid));
    const embed = await create.eventEmbed.leaderboards(leaderboards.splice(0, TO_SHOW));
    const channel = msg.mentions.channels.first() || msg.channel;
    channel.send('<@&754856363938545735>', embed);
}

// CRYPTO PICK
module.exports.cryptoPick = {};
module.exports.cryptoPick.setBuyPrices = async function(msg) {
    let cryptosPicked = (await db.event.fetchCryptosPicked()).map(obj => obj.pick);
    let prices = await endpoints.crypto.getPrices(cryptosPicked);
    await db.event.setCryptoBuyPrices(prices, '');
    let cryptosPicked2 = (await db.event.fetchCryptosPicked2()).map(obj => obj.pick2);
    let prices2 = await endpoints.crypto.getPrices(cryptosPicked2);
    await db.event.setCryptoBuyPrices(prices2, '2');
    let cryptosPicked3 = (await db.event.fetchCryptosPicked3()).map(obj => obj.pick3);
    let prices3 = await endpoints.crypto.getPrices(cryptosPicked3);
    await db.event.setCryptoBuyPrices(prices3, '3');
    msg.reply('set buy prices');
}
module.exports.cryptoPick.sendLeaderboards = async function(msg) {
    const guild = await globals.client.guilds.fetch(config.nextgenServer);
    const users = await db.event.fetchCryptoPickUsers();
    let cryptosPicked = [], allRankings = [];
    for(const user of users) {
        if(!cryptosPicked[user.pick]) { cryptosPicked.push(user.pick); }
        if(!cryptosPicked[user.pick2]) { cryptosPicked.push(user.pick2); }
        if(!cryptosPicked[user.pick3]) { cryptosPicked.push(user.pick3); }
    }
    const prices = await endpoints.crypto.getPrices(cryptosPicked);
    for(const user of users) {
        allRankings.push({
            userid: user.userid,
            pick: user.pick,
            pick2: user.pick2,
            pick3: user.pick3,
            percentageGain: calc.percentChange(parseFloat(user.buy_price), prices[user.pick].price),
            percentageGain2: calc.percentChange(parseFloat(user.buy_price2), prices[user.pick2].price),
            percentageGain3: calc.percentChange(parseFloat(user.buy_price3), prices[user.pick3].price)
        });
    }
    allRankings.sort((a, b) => a.percentageGain+a.percentageGain2+a.percentageGain3 > b.percentageGain+b.percentageGain2+b.percentageGain3 ? -1 : 1);
    let TO_SHOW = 3, leaderboards = [];
    for(user of allRankings) {
        try { var guildMember = (await guild.members.fetch(user.userid)); }
        catch { continue; } // member not in guild
        user.name = guildMember.user.tag;
        leaderboards.push(user);
    }
    db.event.cryptoPickUpdateLatestRank(leaderboards.map(a => a.userid));
    const embed = await create.eventEmbed.cryptoPickLeaderboards(leaderboards.splice(0, TO_SHOW));
    const channel = msg.mentions.channels.first() || msg.channel;
    channel.send('<@&754856363938545735>', embed);
}