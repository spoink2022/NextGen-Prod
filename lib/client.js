const Discord = require('discord.js');

const auth = require('../private/auth.json');
const config = require('../private/config.json');

const db = require('../db');
const commands = require('../commands');

const analytics = require('../lib/trackers/analytics.js');
const buyOrders = require('../lib/trackers/buyOrders.js');
const leaderboards = require('../lib/trackers/leaderboards.js');
const datetime = require('./datetime.js');
let client = new Discord.Client();

client.login(auth.discordToken);

client.on('ready', onReady);
client.on('message', onMessage);
client.on('guildMemberAdd', onGuildMemberAdd);

function onReady() {
    client.user.setActivity(`for ${config.prefix}help`, {type: 'WATCHING'});
    console.log('V1.0.2\nLogged in as ' + client.user.tag + '!');
}

async function onMessage(msg) {
    if(!msg.author.bot) {
        let prefix = config.prefix;
        if(msg.content.startsWith(prefix)) {
            let cmd = msg.content.split(' ')[0].substring(prefix.length).toLowerCase();
            let args = msg.content.substring(cmd.length + prefix.length + 1).toLowerCase().split(' ');
            console.log(`${msg.author.tag}: ${cmd} ${args.join(' ')}`);
            for(let cmdBatch of Object.values(commands)) {
                if(cmdBatch.contains(cmd)) {
                    cmdBatch.run(cmd, args, msg);
                    analytics.increment('messages');
                    return;
                }
            }
        }
    }
}

async function onGuildMemberAdd(guildMember) {
    if(guildMember.user.bot) { return; }
    if(config.serversToSetRoles.includes(guildMember.guild.id)) {
        const memberRole = guildMember.guild.roles.cache.find(role => role.name === "Member");
        guildMember.roles.add(memberRole);
    }
    let userIsNew = await db.user.onJoin(guildMember.user.id);
    if(userIsNew) {
        guildMember.createDM().then((dmChannel) => {
            dmChannel.send('yo');
        }).catch((err) => { console.log('Couldn\'t create DM'); });
    }
}

async function every5Minutes() {
    Promise.all([
    analytics.save(),
    buyOrders.tryBuyOrders(),
    leaderboards.tryLeaderboards()
    ]).then(async() => console.log(`${await datetime.currentTimeString()} - Analytics, Buy Orders, Leaderboards`));
}

setInterval(every5Minutes, 300000);

module.exports = client;