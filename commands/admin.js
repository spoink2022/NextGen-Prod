const create = require('../create');
const db = require('../db');
const config = require('../private/config.json');
const analytics = require('../lib/trackers/analytics.js');
const datetime = require('../lib/datetime.js');

const commands = require('../static').commands.admin;

module.exports.contains = function(cmd) {
    return Object.keys(commands).includes(cmd) || Object.values(commands).flat(1).includes(cmd);
}

module.exports.run = function(cmd, args, msg) {
    if(!config.mods.includes(msg.author.id)) { return; }
    
    if(cmdIs(cmd, 'test')) {
        sendTest(msg, args);
    } else if(cmdIs(cmd, 'test2')) {
        sentTest2(msg, args);
    } else if(cmdIs(cmd, 'getdaily')) {
        sendGetDaily(msg, args);
    } else if(cmdIs(cmd, 'setdaily')) {
        sendSetDaily(msg, args);
    }
}

function cmdIs(given, toCheck) {
    return given === toCheck || commands[toCheck].includes(given);
}

async function sendTest(msg, args) {

}

async function sendTest2(msg, args) {
    
}
// ________________________________________ FUNCTIONS ________________________________________
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