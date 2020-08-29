const create = require('../create');
const db = require('../db');
const datetime = require('../lib/datetime.js');

const commands = require('../static').commands.misc;

module.exports.contains = function(cmd) {
    return Object.keys(commands).includes(cmd) || Object.values(commands).flat(1).includes(cmd);
}

module.exports.run = function(cmd, args, msg) {
    if(cmdIs(cmd, 'ping')) {
        sendPing(msg);
    } else if(cmdIs(cmd, 'passport')) {
        sendPassport(msg);
    }
}

function cmdIs(given, toCheck) {
    return given === toCheck || commands[toCheck].includes(given);
}

// ________________________________________ FUNCTIONS ________________________________________
async function sendPing(msg) {
    const sentMsg = await msg.channel.send("Ping?");
    sentMsg.edit(`Pong! Latency is ${sentMsg.createdTimestamp - msg.createdTimestamp}ms`);
}

async function sendPassport(msg) {
    let author = msg.mentions.users.first() || msg.author;
    let userid = author.id;
    const user = await db.user.fetchUser(userid);
    let nickname = (await msg.guild.members.fetch(userid)).nickname || msg.author.username;
    const roles = msg.guild.member(userid)._roles;
    let rolesString = '', roleNames = [], notableRole = 'member';
    for(roleId of roles) {
        let role = await(msg.guild.roles.fetch(roleId));
        rolesString += `- ${role.name}\n`;
        roleNames.push(role.name);
    }
    if(roleNames.includes('Admin')) { notableRole = 'admin'; }
    else if(roleNames.includes('Tester')) { notableRole = 'tester'; }
    let investingGameString = `Latest Rank: ${user.latest_rank===0 ? 'Unranked' : datetime.rankFormat(user.latest_rank)}
    Transactions: ${user.transactions}
    Tutorial Status: ${user.tutorial==='complete' ? 'Complete' : `Incomplete (next: ${user.tutorial})`}`;
    const embed = await create.embed.passport(author, user, nickname, rolesString, investingGameString, notableRole);
    msg.channel.send(embed);
}