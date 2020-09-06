const config = require('../private/config.json');

const create = require('../create');
const db = require('../db');
const datetime = require('../lib/datetime.js');

const commands = require('../static').commands.misc;
const static = require('../static');

module.exports.contains = function(cmd) {
    return Object.keys(commands).includes(cmd) || Object.values(commands).flat(1).includes(cmd);
}

module.exports.run = function(cmd, args, msg) {
    if(cmdIs(cmd, 'ping')) {
        sendPing(msg);
    } else if(cmdIs(cmd, 'passport')) {
        sendPassport(msg);
    } else if(cmdIs(cmd, 'commands')) {
        sendCommands(msg, args);
    } else if(cmdIs(cmd, 'link')) {
        sendLink(msg, args);
    } else if(cmdIs(cmd, 'help')) {
        sendHelp(msg);
    } else if(cmdIs(cmd, 'version')) {
        sendVersion(msg);
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
    if(msg.channel.type === 'dm') { // called in DM
        msg.reply('Passports cannot be fetched in DM\'s!'); return;
    }
    let author = msg.mentions.users.first() || msg.author;
    let userid = author.id;
    const user = await db.user.fetchUser(userid);
    let nickname = (await msg.guild.members.fetch(userid)).nickname || author.username;
    const roles = msg.guild.member(userid)._roles;
    let rolesString = '', roleNames = [], notableRole = 'member';
    for(roleId of roles) {
        let role = await(msg.guild.roles.fetch(roleId));
        rolesString += `- ${role.name}\n`;
        roleNames.push(role.name);
    }
    let text = {
        investingGame: `Latest Rank: ${user.latest_rank===0 ? 'Unranked' : datetime.rankFormat(user.latest_rank)}
        Transactions: ${user.transactions}
        Tutorial Status: ${user.tutorial==='complete' ? 'Complete' : `Incomplete (next: ${user.tutorial})`}`,
        roles: rolesString
    }
    if(roleNames.includes('Admin')) {
        notableRole = 'admin';
        delete text.investingGame;
    } else if(roleNames.includes('Tester')) {
        notableRole = 'tester';
    }
    const embed = await create.embed.passport(author, user, nickname, text, notableRole);
    msg.channel.send(embed);
}

async function sendCommands(msg, args) {
    let commandChosen = Object.keys(static.text.commands).includes(args[0]) ? args[0] : 'general';
    let helpMessage = static.text.commands[commandChosen];
    const embed = await create.embed.commands(helpMessage, commandChosen);
    msg.channel.send(embed);
}

async function sendLink(msg, args) {
    let linkKey = args[0];
    if(!linkKey || !Object.keys(static.text.link).includes(linkKey)) {
        let description = '';
        for(const[key, val] of Object.entries(static.text.link)) { description += `**${key}** → ${val[1]}\n`; }
        const text = {
            title: 'All Links',
            color: 'link',
            description: description,
            footer: 'This page was shown because either no link or an invalid link was provided'
        };
        const embed = await create.embed.genericEmbed(text);
        msg.channel.send(embed);
    } else {
        msg.channel.send(static.text.link[linkKey][0]);
    }
}

async function sendHelp(msg) {
    const embed = await create.embed.help();
    msg.channel.send(embed);
}

async function sendVersion(msg) {
    msg.channel.send(`Current Version: v${config.version}`);
}