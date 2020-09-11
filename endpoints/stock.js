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
            latestUpdate: json.latestUpdate,
            previousClose: json.previousClose
        };
    }).catch(err => { return null; });
}

module.exports.getLogoUrl = function(ticker) {
    return `https://storage.googleapis.com/iex/api/logos/${ticker.toUpperCase()}.png`;
}

module.exports.getPrices = async function(tickers) { // includes company name + open
    let tickersString = tickers.reduce((a, b) => a + ',' + b, '');
    let response = await fetch(`https://cloud.iexapis.com/stable/stock/market/batch?symbols=${tickersString}&types=quote&token=${keys.IEXCloud}`);
    return response.json().then(json => {
        let res = {};
        for(const[key, val] of Object.entries(json)) { 
            res[key] = {};
            res[key].price = val.quote.latestPrice;
            res[key].companyName = val.quote.companyName;
            res[key].previousClose = val.quote.previousClose;
        }
        return res;
    }).catch(err => { return {}; });
}

module.exports.getChartData = async function(ticker) {
    let response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${keys.alphavantage}`);
    return response.json().then(json => {
        json = json['Time Series (Daily)'];
        let chartData = [];
        for(const[key, val] of Object.entries(json)) {
            chartData.push({t: new Date(key), y: val['4. close']});
        }
        return chartData;
    });
}