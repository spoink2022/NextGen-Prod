const endpoints = require('../endpoints');
const create = require('../create');

const commands = require('../static').commands.lookup;

module.exports.contains = function(cmd) {
    return Object.keys(commands).includes(cmd) || Object.values(commands).flat(1).includes(cmd);
}

module.exports.run = function(cmd, args, msg) {
    if(cmdIs(cmd, 'stock')) {
        sendStock(msg, args);
    } else if(cmdIs(cmd, 'crypto')) {
        sendCrypto(msg, args);
    } else if(cmdIs(cmd, 'search')) {
        sendSearch(msg, args);
    } else if(cmdIs(cmd, 'event')) {
        sendEvent(msg);
    }
}

function cmdIs(given, toCheck) {
    return given === toCheck || commands[toCheck].includes(given);
}

// ________________________________________ FUNCTIONS ________________________________________
async function sendStock(msg, args) {
    let ticker = args[0];
    if(!ticker) { // no ticker provided
        msg.reply('**No Ticker Provided**\nThe command `stock <ticker>` expects a value for `<ticker>`'); return;
    }
    const quote = await endpoints.stock.getQuote(ticker);
    if(!quote) { // no data on quote
        msg.reply(`**Stock Not Found**\n\`${ticker.toUpperCase()}\` is not a valid ticker value!`); return;
    }
    //const chartData = await endpoints.stock.getChartData(ticker);
    //if(chartData) { var stockGraphCanvas = await create.canvas.stockGraph(ticker, chartData, quote.change1D); }
    try { var stockGraphCanvas = await create.canvas.stockGraph(ticker); }
    catch { }
    const embed = await create.embed.stockInfo(quote, stockGraphCanvas); // canvas as a parameter
    msg.channel.send(embed);
}

async function sendCrypto(msg, args) {
    let symbol = args[0];
    if(!symbol) { // no symbol provided
        msg.reply('**No Symbol Provided**\nThe command `crypto <symbol>` expects a value for `<symbol>`'); return;
    }
    const quote = await endpoints.crypto.getQuote(symbol.toUpperCase());
    if(!quote) { // no data on quote
        msg.reply(`**Cryptocurrency Not Found**\n\`${symbol.toUpperCase()}\` is not a valid cryptocurrency!`); return;
    }
    const chartData = await endpoints.crypto.getChartData(quote.name.toLowerCase());
    if(chartData) { var cryptoGraphCanvas = await create.canvas.cryptoGraph(symbol, chartData, quote.change1D>=0); }
    const embed = await create.embed.cryptoInfo(quote, cryptoGraphCanvas);
    msg.channel.send(embed);
}

async function sendSearch(msg, args) {
    let searchQuery = args.join(' ');
    if(!searchQuery) { // no search query provided
        msg.reply('**No Query Provided**\nThe command `search <query>` expects a value for `<query>`'); return;
    }
    const searchResults = await endpoints.search.getStockTickers(searchQuery);
    if(!searchResults) { // no results for query
        msg.reply(`**No Results**\n\`${searchQuery}\` could not be matched to a ticker symbol!`); return;
    }
    const embed = await create.embed.stockSearch(searchResults);
    msg.channel.send(embed);
}

async function sendEvent(msg) {
    msg.channel.send('https://forms.gle/42B77zC8986mMs2TA');
}