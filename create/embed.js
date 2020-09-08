const Discord = require('discord.js');

const config = require('../private/config.json');

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
module.exports.genericEmbed = function(text) {
    let embed = new Discord.MessageEmbed();
    if(text.title) { embed.setTitle(text.title.replace('${prefix}', config.prefix)); }
    if(text.author) { embed.setAuthor(text.author[0].replace('${prefix}', config.prefix), text.author[1]); }
    if(text.color) { embed.setColor(colors[text.color]); }
    if(text.description) { embed.setDescription(text.description); }
    if(text.fields) {
        for(const[key, value] of Object.entries(text.fields)) {
            embed.addField(key, value);
        }
    }
    if(text.footer) { embed.setFooter(text.footer); }
    return embed;
}

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
    if(text.footer) { embed.setFooter(text.footer); }
    msg.reply(' ', embed).then(sentEmbed => {
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
            embed.setFooter(' ');
            if(endReason === 'confirm') {
                embed.setColor(colors.processing);
                embed.setTitle(text.processing);
                await sentEmbed.edit(embed)
                await callback(true);
                const reEditEmbed = function() {
                    embed = sentEmbed.embeds[0];
                    embed.setColor(colors.success);
                    embed.setTitle(text.confirm);
                    sentEmbed.edit(embed);
                }
                setTimeout(reEditEmbed, 1000);
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
module.exports.stockInfo = function(quote, stockGraphCanvas=null) {
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
    if(stockGraphCanvas) {
        const attachment = new Discord.MessageAttachment(stockGraphCanvas.toBuffer(), `${quote.ticker}.png`);
        embed.attachFiles(attachment);
        embed.setImage(`attachment://${quote.ticker}.png`);
    }
    return embed;
}

module.exports.cryptoInfo = function(q, cryptoGraphCanvas=null) {
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
    if(cryptoGraphCanvas) {
        const attachment = new Discord.MessageAttachment(cryptoGraphCanvas, `${q.symbol}.png`);
        embed.attachFiles(attachment);
        embed.setImage(`attachment://${q.symbol}.png`);
    }
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

module.exports.passport = async function(author, user, nickname, text, notableRole) {
    const joinDate = new Date(user.day_joined);
    let embed = new Discord.MessageEmbed();
    embed.setTitle(`${format.padWithDashes(' ' + nickname+'\'s Passport ', 48)}`);
    embed.setColor(colors.passport[notableRole]);
    embed.setThumbnail(author.displayAvatarURL());
    embed.addFields(
        {name: 'Profile', value: `Date Joined: ${datetime.epochToDateJoined(joinDate.getTime())}`},
        {name: 'Roles', value: text.roles}
    );
    if(text.investingGame) { embed.addField('Investing Game', text.investingGame); }
    return embed;
}

module.exports.tutorial = async function(author, step, fieldName, fieldValue, footerValue=null) {
    let embed = new Discord.MessageEmbed();
    embed.setAuthor(author.tag, author.displayAvatarURL());
    embed.setTitle(`Tutorial - (${step}/6)`);
    embed.setColor(colors.tutorial);
    embed.addField(fieldName, fieldValue);
    if(footerValue) { embed.setFooter(footerValue); }
    return embed;
}

module.exports.commands = async function(helpMessage, commandChosen) {
    const footer = commandChosen==='general' ? `For more information on a specific command, type ${config.prefix}commands <command>` : `For an overview of commands, type ${config.prefix}commands`;
    let embed = new Discord.MessageEmbed();
    embed.setTitle(`Commands - ${commandChosen.toUpperCase()}`);
    embed.setColor(colors.commands);
    if(commandChosen==='general') { 
        for(let tuple of helpMessage) { embed.addField(tuple[0], `\`${config.prefix}${tuple[1].join('\n`'+config.prefix)}`); }
    } else {
        for(let i=0; i<helpMessage[1].length; i++) { helpMessage[1][i] = helpMessage[1][i].replace('${prefix}', config.prefix); }
        embed.addField(config.prefix+helpMessage[0], helpMessage[1].join('\n'));
    }
    embed.setFooter(footer);
    return embed;
}

module.exports.help = async function() {
    let embed = new Discord.MessageEmbed();
    embed.setTitle('Welcome!');
    embed.setColor(colors.help);
    embed.setDescription(`Hello, I am the NextGen bot, and welcome to our server!`);
    embed.addFields(
        {name: 'How do get I started with investing?', value: `Just type \`${config.prefix}init\``}
    );
    embed.setFooter(`For a full list of commands, type \`${config.prefix}commands\``);
    return embed;
}