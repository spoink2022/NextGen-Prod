const Discord = require('discord.js');

const datetime = require('../lib/datetime.js');
const format = require('../lib/format.js');
const colors = require('../static').colors;

module.exports.getDaily = async function(rewards) {
    let embed = new Discord.MessageEmbed();
    embed.setTitle('Upcoming Daily Rewards');
    embed.setColor(colors.admin);
    for(reward of rewards) {
        embed.addField(reward.day_varchar, `${reward.type} ${reward.data}`, true);
    }
    if(rewards.length % 3 !== 0) {
        for(let i=0; i<3-rewards.length%3; i++) { embed.addField('-', '-', true); }
    }
    return embed;
}

module.exports.analytics = async function(messages, transactions, daily) {
    let embed = new Discord.MessageEmbed();
    embed.setTitle('Analytics');
    embed.setColor(colors.admin);
    embed.addFields(
        {name: 'Messages Sent', value: messages, inline: true},
        {name: 'Transactions', value: transactions, inline: true},
        {name: 'Daily Collected', value: daily, inline: false}
    );
    return embed;
}

module.exports.leaderboards = async function(leaderboards) {
    let embed = new Discord.MessageEmbed();
    embed.setTitle(`Investing Game Leaderboards - ${datetime.epochToDateJoined(datetime.getEpochEST())}`);
    embed.setColor(colors.admin);
    for(let i=0; i<leaderboards.length; i++) {
        const entry = leaderboards[i];
        embed.addField(`${datetime.rankFormat(i+1)} - ${entry.name}`, `${format.dollarValue(entry.netWorth, 2)}${i===leaderboards.length-1 ? '' : '\n\u200B'}`);
    }
    return embed;
}