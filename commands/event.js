const { MessageAttachment } = require('discord.js');

const create = require('../create');
const db = require('../db');
const endpoints = require('../endpoints');
const calc = require('../lib/calc.js');
const datetime = require('../lib/datetime.js');

const commands = require('../static').commands.event;

module.exports.contains = function(cmd) {
    return Object.keys(commands).includes(cmd) || Object.values(commands).flat(1).includes(cmd);
}

module.exports.run = async function(cmd, args, msg) {
    if(cmdIs(cmd, 'pick')) {
        //sendPick(msg);
        sendCryptoPick(msg);
    }
}

function cmdIs(given, toCheck) {
    return given === toCheck || commands[toCheck].includes(given);
}

// ________________________________________ FUNCTIONS ________________________________________
async function sendPick(msg) {
    let stockPickUser = await db.event.fetchStockPickUser(msg.author.id);
    if(!stockPickUser) { // user not signed up
        return;
    }
    const quote = await endpoints.stock.getQuote(stockPickUser.pick);
    const quote2 = await endpoints.stock.getQuote(stockPickUser.pick2);
    const embed = await create.eventEmbed.stockPick(msg.author, stockPickUser, quote, quote2);
    msg.channel.send(embed).then(async(sentMessage) => {
        let embed = sentMessage.embeds[0];

        const chartData = await endpoints.event.getChartDataStockPick(stockPickUser.pick, stockPickUser.day);
        if(chartData[0]) {
            chartData[chartData.length-1].y = stockPickUser.buy_price;
        } else {
            chartData.push({t: datetime.epochToEpochEST((new Date(stockPickUser.day)).getTime()), y: stockPickUser.buy_price});
        }
        if(!chartData[0] || chartData[0].t < quote.latestUpdate) { chartData.unshift({t: quote.latestUpdate, y: quote.price}); }

        const chartData2 = await endpoints.event.getChartDataStockPick(stockPickUser.pick2, stockPickUser.day);
        if(chartData2[0]) {
            chartData2[chartData2.length-1].y = stockPickUser.buy_price2;
        } else {
            chartData2.push({t: datetime.epochToEpochEST((new Date(stockPickUser.day)).getTime()), y: stockPickUser.buy_price2});
        }
        if(!chartData2[0] || chartData2[0].t < quote2.latestUpdate) { chartData2.unshift({t: quote2.latestUpdate, y: quote2.price}); }

        let up = calc.percentChange(stockPickUser.buy_price, quote.price) >= 0, up2 = calc.percentChange(stockPickUser.buy_price2, quote2.price) >= 0;
        const graphCanvas = await create.canvas.event.stockPickGraph(chartData, chartData2, up, up2, stockPickUser.pick, stockPickUser.pick2);
        const attachment = new MessageAttachment(graphCanvas, `${stockPickUser.pick}.png`);
        embed.attachFiles(attachment);
        embed.setImage(`attachment://${stockPickUser.pick}.png`);
        embed.setFooter('');
        await sentMessage.delete();
        msg.channel.send(embed);
    });
}

async function sendCryptoPick(msg) {
    let cryptoPickUser = await db.event.fetchCryptoPickUser(msg.author.id);
    let c = cryptoPickUser;
    if(!cryptoPickUser) { // user not signed up, therefore command empty
        return;
    }
    let quotes = await endpoints.crypto.getPrices([c.pick, c.pick2, c.pick3]);
    const embed = await create.eventEmbed.cryptoPick(msg.author, c, quotes[c.pick], quotes[c.pick2], quotes[c.pick3]);
    msg.channel.send(embed).then(async(sentMessage) => {
        let embed = sentMessage.embeds[0];

        const chartData = await endpoints.event.getChartDataCryptoPick(quotes[c.pick].name.toLowerCase(), c.day);
        const chartData2 = await endpoints.event.getChartDataCryptoPick(quotes[c.pick2].name.toLowerCase(), c.day);
        const chartData3 = await endpoints.event.getChartDataCryptoPick(quotes[c.pick3].name.toLowerCase(), c.day);

        const graphCanvas = await create.canvas.event.cryptoPickGraph(chartData, chartData2, chartData3, c.pick, c.pick2, c.pick3);
        const attachment = new MessageAttachment(graphCanvas, `${cryptoPickUser.pick}.png`);
        embed.attachFiles(attachment);
        embed.setImage(`attachment://${cryptoPickUser.pick}.png`);
        embed.setFooter('');
        await sentMessage.delete();
        msg.channel.send(embed);
    });
}