const Discord = require('discord.js');

const config = require('../private/config.json');

const colors = require('../static').colors;
const calc = require('../lib/calc.js');
const datetime = require('../lib/datetime.js');
const format = require('../lib/format.js');

// STOCKPICK #1
module.exports.stockPick = async function(author, stockPickUser, quote, quote2) {
    const change1 = calc.percentChange(stockPickUser.buy_price, quote.price);
    const change2 = calc.percentChange(stockPickUser.buy_price2, quote2.price);
    let embed = new Discord.MessageEmbed();
    embed.setTitle('Stock Pick Challenge: Sept 14th - Oct 1st');
    embed.setAuthor(author.tag, author.displayAvatarURL());
    embed.setColor(colors.stockpick1);
    embed.setDescription(
        `**General**
        Avg Overall Change: ${format.percentageValue((change1 + change2)/2, 2)}
        Latest Rank: ${stockPickUser.latest_rank > 0 ? datetime.rankFormat(stockPickUser.latest_rank) : 'Unranked'}`
        );
    embed.addField(`${stockPickUser.company_name} (${stockPickUser.pick})`,
        `Today's Change: ${format.percentageValue(quote.changePercent*100, 2)}
        Overall Change: ${format.percentageValue(change1, 2)}`,
        true);
    embed.addField(`${stockPickUser.company_name2} (${stockPickUser.pick2})`,
        `Today's Change: ${format.percentageValue(quote2.changePercent*100, 2)}
        Overall Change: ${format.percentageValue(change2, 2)}`,
        true);
    embed.setFooter('Loading graphs...');
    return embed;
}

module.exports.leaderboards = async function(leaderboards) {
    let color = (new Date(datetime.getEpochEST())).getUTCDate() % 2 === 0 ? colors.stockpick1 : colors.stockpick2;
    let embed = new Discord.MessageEmbed();
    embed.setTitle(`Stock Pick Challenge Leaderboards - ${datetime.epochToDateJoined(datetime.getEpochEST())}`);
    embed.setColor(color);
    for(let i=0; i<leaderboards.length; i++) {
        const entry = leaderboards[i];
        const emoji = [':first_place:', ':second_place:', ':third_place:']
        embed.addField(`${datetime.rankFormat(i+1)} - ${entry.name} ${emoji[i]}`,
        `Avg Overall Change: ${format.percentageValue((entry.percentageGain+entry.percentageGain2)/2, 2)}
        Picks: ${entry.pick}, ${entry.pick2}${i===leaderboards.length-1 ? '' : '\n\u200B'}`);
    }
    return embed;
}

// CRYPTOPICK #1
module.exports.cryptoPick = async function(author, cryptoPickUser, quote, quote2, quote3) {
    const change1 = calc.percentChange(cryptoPickUser.buy_price, quote.price);
    const change2 = calc.percentChange(cryptoPickUser.buy_price2, quote2.price);
    const change3 = calc.percentChange(cryptoPickUser.buy_price3, quote3.price);
    let embed = new Discord.MessageEmbed();
    embed.setTitle('Crypto Pick Challenge: Nov 15th - Dec 25th');
    embed.setAuthor(author.tag, author.displayAvatarURL());
    embed.setColor(colors.cryptoPick);
    embed.setDescription(
        `**General**
        Avg Overall Change: ${format.percentageValue((change1 + change2 + change3)/3, 2, true)}
        Latest Rank: ${cryptoPickUser.latest_rank > 0 ? datetime.rankFormat(cryptoPickUser.latest_rank) : 'Unranked'}`
    );
    embed.addField(`${quote.name} (${cryptoPickUser.pick})`,
    `Today: ${format.percentageValue(quote.change1D*100, 2, forcePlus=true)}
    Overall: ${format.percentageValue(change1, 2, true)}`,
    true);
    embed.addField(`${quote2.name} (${cryptoPickUser.pick2})`,
    `Today: ${format.percentageValue(quote2.change1D*100, 2, true)}
    Overall: ${format.percentageValue(change2, 2, true)}`,
    true);
    embed.addField(`${quote3.name} (${cryptoPickUser.pick3})`,
    `Today: ${format.percentageValue(quote3.change1D*100, 2, true)}
    Overall: ${format.percentageValue(change3, 2, true)}`,
    true);
    embed.setFooter('Loading graphs...');
    return embed;
}

module.exports.cryptoPickLeaderboards = async function(leaderboards) {
    let embed = new Discord.MessageEmbed();
    embed.setTitle(`Crypto Pick Challenge Leaderboards - ${datetime.epochToDateJoined(datetime.getEpochEST())}`);
    embed.setColor(colors.cryptoPick);
    for(let i=0; i<leaderboards.length; i++) {
        const entry = leaderboards[i];
        const emoji = [':first_place:', ':second_place:', ':third_place:']
        embed.addField(`${datetime.rankFormat(i+1)} - ${entry.name} ${emoji[i]}`,
        `Avg Overall Change: ${format.percentageValue((entry.percentageGain+entry.percentageGain2+entry.percentageGain3)/3, 2)}
        Picks: ${entry.pick}, ${entry.pick2}, ${entry.pick3}${i===leaderboards.length-1 ? '' : '\n\u200B'}`);
    }
    return embed;
}