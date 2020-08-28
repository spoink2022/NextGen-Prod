const Discord = require('discord.js');

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