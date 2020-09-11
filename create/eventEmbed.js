const Discord = require('discord.js');

const config = require('../private/config.json');

const colors = require('../static').colors;
const calc = require('../lib/calc.js');
const datetime = require('../lib/datetime.js');
const format = require('../lib/format.js');

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