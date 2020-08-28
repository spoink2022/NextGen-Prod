const fetch = require('node-fetch');

const keys = require('../private/keys.json');

module.exports.getQuote = async function(ticker) {
    let response = await fetch(`https://cloud.iexapis.com/stable/stock/${ticker}/quote?token=${keys.IEXCloud}`);
    return response.json().then(json => {
        return {
            ticker: json.symbol,
            companyName: json.companyName,
            logoUrl: this.getLogoUrl(ticker),
            price: json.latestPrice,
            change: json.change,
            changePercent: json.changePercent,
            week52High: json.week52High,
            week52Low: json.week52Low,
            ytdChange: json.ytdChange,
            volume: json.avgTotalVolume,
            marketcap: json.marketCap,
            exchange: json.primaryExchange,
            latestUpdate: json.latestUpdate
        };
    }).catch(err => { return null; });
}

module.exports.getLogoUrl = function(ticker) {
    return `https://storage.googleapis.com/iex/api/logos/${ticker.toUpperCase()}.png`;
}

module.exports.getPrices = async function(tickers) { // includes company name
    let tickersString = tickers.reduce((a, b) => a + ',' + b, '');
    let response = await fetch(`https://cloud.iexapis.com/stable/stock/market/batch?symbols=${tickersString}&types=quote&token=${keys.IEXCloud}`);
    return response.json().then(json => {
        let res = {};
        for(const[key, val] of Object.entries(json)) { 
            res[key] = {};
            res[key].price = val.quote.latestPrice;
            res[key].companyName = val.quote.companyName;
        }
        return res;
    }).catch(err => { return {}; });
}