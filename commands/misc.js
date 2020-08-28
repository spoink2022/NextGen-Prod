const commands = require('../static').commands.misc;

module.exports.contains = function(cmd) {
    return Object.keys(commands).includes(cmd) || Object.values(commands).flat(1).includes(cmd);
}

module.exports.run = function(cmd, args, msg) {
    if(cmdIs(cmd, 'ping')) {
        sendPing(msg);
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