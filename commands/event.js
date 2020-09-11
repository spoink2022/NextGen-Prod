const { MessageAttachment } = require('discord.js');

const create = require('../create');
const db = require('../db');
const endpoints = require('../endpoints');
const calc = require('../lib/calc.js');

const commands = require('../static').commands.event;

module.exports.contains = function(cmd) {
    return Object.keys(commands).includes(cmd) || Object.values(commands).flat(1).includes(cmd);
}

module.exports.run = async function(cmd, args, msg) {
    if(cmdIs(cmd, 'pick')) {
        sendPick(msg);
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
        chartData[chartData.length-1].y = stockPickUser.buy_price;
        if(chartData[0].t < quote.latestUpdate) { chartData.unshift({t: quote.latestUpdate, y: quote.price}); }

        const chartData2 = await endpoints.event.getChartDataStockPick(stockPickUser.pick2, stockPickUser.day);
        chartData2[chartData2.length-1].y = stockPickUser.buy_price2;
        if(chartData2[0].t < quote2.latestUpdate) { chartData2.unshift({t: quote2.latestUpdate, y: quote2.price}); }

        console.log(chartData);
        console.log(chartData2);

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