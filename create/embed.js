const Discord = require('discord.js');

const colors = require('../static').colors;
const datetime = require('../lib/datetime.js');
const format = require('../lib/format.js');

/*
- titleOnly

- stockInfo
- cryptoInfo
- stockSearch
*/

// ____________________ UTILITY ____________________
module.exports.titleOnly = function(content, author=null, color=null) {
    let embed = new Discord.MessageEmbed();
    if(author) { embed.setAuthor(author.tag, author.displayAvatarURL()); }
    embed.setTitle(content);
    if(color) { embed.setColor(colors[color]); }
    return embed;
}

module.exports.ask = function(msg, text, callback) {
    let embed = new Discord.MessageEmbed();
    embed.setAuthor(msg.author.tag, msg.author.displayAvatarURL());
    embed.setTitle(text.ask);
    embed.setColor(colors.ask);
    msg.channel.send(embed).then(sentEmbed => {
        sentEmbed.react('✅');
        sentEmbed.react('❌');
        const filter = (reaction, user) => { return ['✅', '❌'].includes(reaction.emoji.name) && user.id === msg.author.id; }
        let endReason = 'time';
        const collector = sentEmbed.createReactionCollector(filter,{ time: 15000 });
        collector.on('collect', (reaction, user) => {
            if(reaction.emoji.name === '✅') { endReason = 'confirm'; }
            else { endReason = 'reject'; }
            collector.stop();
        });
        collector.on('end', async() => {
            sentEmbed.reactions.removeAll().catch(error => console.error('Failed to clear reactions (DM Channel)'));
            embed = sentEmbed.embeds[0];
            if(endReason === 'confirm') {
                embed.setColor(colors.processing);
                embed.setTitle(text.processing);
                await sentEmbed.edit(embed)
                await callback(true);
                embed = sentEmbed.embeds[0];
                embed.setColor(colors.success);
                embed.setTitle(text.confirm);
                sentEmbed.edit(embed);
            } else if(endReason === 'reject') {
                embed.setColor(colors.reject);
                embed.setTitle(text.reject);
                sentEmbed.edit(embed);
                callback(false);
            } else {
                embed.setColor(colors.timeOut);
                embed.setTitle('Timed out after 15 seconds!');
                sentEmbed.edit(embed);
                callback(false);
            }
        });
    });
}
// ___________________ SPECIFIC ____________________
// ---------- Info ----------
module.exports.stockInfo = function(quote) {
    let embed = new Discord.MessageEmbed();
    embed.setAuthor(quote.ticker, quote.logoUrl);
    embed.setColor(quote.change >= 0 ? colors.stockUp : colors.stockDown);
    embed.addFields(
        {name: quote.companyName || 'No Data', value: `Price: **${format.dollarValue(quote.price, 2)}** \
        (Change: **${format.percentageValue(quote.changePercent*100, 2)}** | **${format.dollarValue(quote.change, 3)}**)\n\u200B`},
        {name: '52-Week High', value: format.dollarValue(quote.week52High, 2), inline: true},
        {name: '52-Week Low', value: format.dollarValue(quote.week52Low, 2), inline: true},
        {name: 'YTD Change', value: format.percentageValue(quote.ytdChange*100, 2), inline: true},
        {name: 'Volume', value: format.intValue(quote.volume), inline: true},
        {name: 'Marketcap', value: format.dollarValue(quote.marketcap, 0), inline: true},
        {name: 'Exchange', value: quote.exchange || 'No Data', inline: true}
    );
    embed.setFooter('Last updated ' + datetime.epochToDateString(datetime.epochToEpochEST(quote.latestUpdate)));
    return embed;
}

module.exports.cryptoInfo = function(q) {
    let embed = new Discord.MessageEmbed();
    embed.setAuthor(q.symbol, q.logoUrl);
    embed.setColor(q.change1DPercent >= 0 ? colors.cryptoUp : colors.cryptoDown);
    embed.addFields(
        {name: `${q.name} (${q.symbol})`, value: `Price: **${format.dollarValue(q.price, 8)}** \
        (Change: **${format.percentageValue(q.change1DPercent*100, 2)}** | **${format.dollarValue(q.change1D, 8)}**)\n\u200B`},
        {name: '7-Day Change', value: format.percentageValue(q.change7DPercent*100, 2), inline: true},
        {name: '30-Day Change', value: format.percentageValue(q.change30DPercent*100, 2), inline: true},
        {name: 'YTD Change', value: format.percentageValue(q.ytdChangePercent*100, 2), inline: true},
        {name: 'Current Supply', value: format.intValue(q.supply), inline: true},
        {name: 'Max Supply', value: format.intValue(q.maxSupply), inline: true},
        {name: 'Marketcap', value: format.dollarValue(q.marketcap, 0), inline: true}
    );
    embed.setFooter('Last updated ' + datetime.epochToDateString(datetime.epochToEpochEST(q.latestUpdate)));
    return embed;
}

module.exports.stockSearch = function(res) {
    let embed = new Discord.MessageEmbed();
    embed.setTitle('Ticker Results');
    embed.setColor(colors.stockSearch);
    for(let i=0; i<Math.min(res.length, 3); i++) {
        embed.addField(res[i]['2. name'], res[i]['1. symbol'], false);
    }
    return embed;
}

// ---------- Game ----------
module.exports.balance = async function(author, cash, netWorth) {
    let embed = new Discord.MessageEmbed();
    embed.setAuthor(author.tag, author.displayAvatarURL());
    embed.setTitle('Balance');
    embed.setColor(colors.balance);
    embed.addFields(
        {name: 'Cash', value: format.dollarValue(cash, 2)},
        {name: 'Net Worth', value: Number.isFinite(netWorth) ? format.dollarValue(netWorth, 2) : netWorth}
    );
    return embed;
}

module.exports.listStock = async function(author, stocks, page, maxPage) {
    let embed = new Discord.MessageEmbed();
    embed.setAuthor(author.tag, author.displayAvatarURL());
    embed.setTitle(`Stock - Page ${page} of ${maxPage}`);
    embed.setColor(colors.list);
    for(const[key, val] of Object.entries(stocks)) {
        let sign = val.change>=0 ? '+' : '';
        embed.addField(`${val.type} - ${val.companyName} (${key})`, '```diff\n'
        + `${sign}${format.percentageValue(val.changePct, 3)} | ${sign}${format.dollarValue(val.change, 2)}`
        + `\n---By Unit: ${format.dollarValue(val.buyPrice, 2)} → ${format.dollarValue(val.price, 2)}`
        + `\n---By Trade(${val.qt}): ${format.dollarValue(val.buyPrice*val.qt, 2)} → ${format.dollarValue(val.price*val.qt, 2)}`
        + '\n```'
        );
    }
    if(Object.keys(stocks).length === 0) { embed.setTitle('You have no stocks!'); }
    return embed;
}

module.exports.listCrypto = async function(author, crypto, page, maxPage) {
    let embed = new Discord.MessageEmbed();
    embed.setAuthor(author.tag, author.displayAvatarURL());
    embed.setTitle(`Crypto - Page ${page} of ${maxPage}`);
    embed.setColor(colors.list);
    for(const[key, val] of Object.entries(crypto)) {
        let sign = val.change>=0 ? '+' : '';
        embed.addField(`${val.type} - ${val.name} (${key})`, '```diff\n'
        + `${sign}${format.percentageValue(val.changePct, 3)} | ${sign}${format.dollarValue(val.change, 4)}`
        + `\n---By Unit: ${format.dollarValue(val.buyPrice, 8)} → ${format.dollarValue(val.price, 8)}`
        + `\n---By Trade(${val.qt}): ${format.dollarValue(val.buyPrice*val.qt, 4)} → ${format.dollarValue(val.price*val.qt, 4)}`
        + '\n```');
    }
    if(Object.keys(crypto).length === 0) { embed.setTitle('You have no crypto!'); }
    return embed;
}

module.exports.listOrders = async function(author, orders) {
    let embed = new Discord.MessageEmbed();
    embed.setAuthor(author.tag, author.displayAvatarURL());
    embed.setTitle('Stock Orders');
    embed.setColor(colors.list);
    for(const[key, val] of Object.entries(orders)) {
        embed.addField(`ORDER: ${val>0 ? 'BUY' : 'SELL'} - ${key}`, '```diff\n'
        + `---Quantity: ${val}`
        + '\n```');
    }
    if(Object.keys(orders).length === 0) { embed.setTitle('You have no stock orders!'); }
    return embed;
}

module.exports.savings = async function(author, d) {
    let embed = new Discord.MessageEmbed();
    embed.setAuthor(author.tag, author.displayAvatarURL());
    embed.setTitle('Savings Account (2% APY)');
    embed.setColor(colors.savings);
    embed.addField(`Last Deposit (fixed-to-hour): ${d.lastDeposit}`, '```diff\n'
    + `+${format.percentageValue(d.changePct, 4)} | +${format.dollarValue(d.change, 4)}`
    + `\n---${format.dollarValue(d.oldBalance, 4)} → ${format.dollarValue(d.newBalance, 4)}`
    + '\n```');
    return embed;
}