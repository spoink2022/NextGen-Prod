const config = require('../private/config.json');
const create = require('../create');
const db = require('../db');

module.exports.recommendBuy = async function(msg) {
    await db.user.alterTutorial(msg.author.id, 'buy');
    let fieldName = 'Congratulations, you\'ve created an investing account with $20,000!';
    let fieldValue = `Now that you have an account, let's buy some stocks.
    \n\`${config.prefix}buy stock aapl 10\` will buy - or preorder if markets are closed - 10 AAPL shares (Apple Inc.), so let's try that`;
    const embed = await create.embed.tutorial(msg.author, 1, fieldName, fieldValue);
    msg.reply(embed);
}

module.exports.recommendList = async function(msg, ticker) {
    await db.user.alterTutorial(msg.author.id, 'list');
    let fieldName = `Good job, you managed to buy some ${ticker}!`;
    let fieldValue = `Now let's take a look at what you bought.
    \n\`${config.prefix}list all\` will show all your assets and orders, so type that in`;
    const embed = await create.embed.tutorial(msg.author, 2, fieldName, fieldValue);
    msg.reply(embed);
}

module.exports.recommendBalance = async function(msg) {
    await db.user.alterTutorial(msg.author.id, 'balance');
    let fieldName = `As you can see, you bought/preordered some assets!`;
    let fieldValue = `But how do you check your cash in the first place?
    \nType \`${config.prefix}balance\` to check your balance & networth`;
    const embed = await create.embed.tutorial(msg.author, 3, fieldName, fieldValue);
    msg.reply(embed);
}

module.exports.recommendSell = async function(msg) {
    await db.user.alterTutorial(msg.author.id, 'sell');
    let fieldName = `Nice, you now know your balance! (and networth)`;
    let fieldValue = `Finally, let's sell/presell our assets.
    \nFor those of you who bought 10 shares of AAPL, that's \`${config.prefix}sell stock aapl 10\``;
    const embed = await create.embed.tutorial(msg.author, 4, fieldName, fieldValue);
    msg.reply(embed);
}

module.exports.recommendDaily = async function(msg) {
    await db.user.alterTutorial(msg.author.id, 'daily');
    let fieldName = `Good job, you figured out how to sell stuff!`;
    let fieldValue = `Last but not least, let's collect our daily reward
    \nType \`${config.prefix}daily\` to collect your daily reward`;
    let footerValue = `Don't forget to do it again tomorrow!`;
    const embed = await create.embed.tutorial(msg.author, 5, fieldName, fieldValue, footerValue);
    msg.reply(embed);
}

module.exports.complete = async function(msg) {
    const investorRole = await msg.guild.roles.cache.find(role => role.name === 'Investor');
    const member = msg.guild.member(msg.author.id);
    member.roles.add(investorRole);
    await db.user.alterTutorial(msg.author.id, 'complete');
    let fieldName = `Congratulations, you've mastered the basics of investing!`;
    let fieldValue = `You've also been given the "Investor" role!
    \nFinally, for a full list of commands, check out \`${config.prefix}commands\``;
    const embed = await create.embed.tutorial(msg.author, 6, fieldName, fieldValue);
    msg.reply(embed);
}