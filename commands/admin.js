const create = require('../create');
const db = require('../db');
const config = require('../private/config.json');
const analytics = require('../lib/trackers/analytics.js');
const buyOrders = require('../lib/trackers/buyOrders.js');
const datetime = require('../lib/datetime.js');
const gameLogic = require('../lib/gameLogic.js');

const commands = require('../static').commands.admin;

module.exports.contains = function(cmd) {
    return Object.keys(commands).includes(cmd) || Object.values(commands).flat(1).includes(cmd);
}

module.exports.run = function(cmd, args, msg) {
    if(!config.mods.includes(msg.author.id)) { return; }
    
    if(cmdIs(cmd, 'test')) {
        sendTest(msg, args);
    } else if(cmdIs(cmd, 'test2')) {
        sendTest2(msg, args);
    } else if(cmdIs(cmd, 'analytics')) {
        sendAnalytics(msg);
    } else if(cmdIs(cmd, 'getdaily')) {
        sendGetDaily(msg, args);
    } else if(cmdIs(cmd, 'setdaily')) {
        sendSetDaily(msg, args);
    } else if(cmdIs(cmd, 'leaderboards')) {
        this.sendLeaderboards(msg);
    }
}

function cmdIs(given, toCheck) {
    return given === toCheck || commands[toCheck].includes(given);
}

async function sendTest(msg, args) {
    buyOrders.all();
}

async function sendTest2(msg, args) {
    console.log(datetime.isMarketOpen());
}
// ________________________________________ FUNCTIONS ________________________________________
async function sendAnalytics(msg) {
    let a = await analytics.fetch();
    const embed = await create.adminEmbed.analytics(a.messages, a.transactions, a.daily);
    msg.channel.send(embed);
}

async function sendGetDaily(msg, args) {
    const today = await datetime.currentDayDashedString();
    let foresight = Math.min(parseInt(args[0]) || 1, 25); // discord embeds can't have more than 25 fields
    const rewards = await db.server.getDailyMultiple(today, foresight);
    const embed = await create.adminEmbed.getDaily(rewards);
    msg.channel.send(embed);
}

async function sendSetDaily(msg, args) {
    if(args.length < 3) { // not enough args
        msg.reply('**Not Enough Args**'); return;
    }
    let day = args[0], type = args[1], value;
    if(type === 'cash') { value = args[2]; }
    else if(['stock', 'crypto'].includes(type)) { value = `${args[2].toUpperCase()} ${args[3]}`; }
    else { msg.reply('**Expected one of: [cash, stock, crypto]**'); return; }
    await db.server.setDaily(day, type, value);
    msg.reply(`Success! Set ${day} as "${type}" "${value}"`);
}

module.exports.sendLeaderboards = async function(msg, channelId=null) {
    const guild = await globals.client.guilds.fetch(config.nextgenServer);
    const users = await db.server.fetchUsersWithAccounts();
    let allRankings = [];
    for(user of users) {
        user.money = parseFloat(user.money);
        allRankings.push({
            userid: user.userid,
            netWorth: await gameLogic.getNetWorth(user)
        });
    }
    allRankings.sort((a, b) => a.netWorth > b.netWorth ? -1 : 1);
    let TO_SHOW = 3, leaderboards = [];
    for(user of allRankings) {
        try { var guildMember = (await guild.members.fetch(user.userid)); }
        catch { continue; } // member not in guild
        user.nickname = guildMember.nickname || guildMember.user.username;
        user.name = guildMember.user.tag;
        leaderboards.push(user);
    }
    db.server.updateLatestRank(leaderboards.map(a => a.userid));
    const embed = await create.adminEmbed.leaderboards(leaderboards.splice(0, TO_SHOW));
    const channel = channelId ? await guild.channels.resolve(channelId) : msg.mentions.channels.first() || msg.channel;
    //channel.send('<@&730168677290344481>', embed);
    channel.send(embed);
}