const fetch = require('node-fetch');

const keys = require('../private/keys');

module.exports.getQuote = async function(symbol) {
    let response = await fetch(`https://api.nomics.com/v1/currencies/ticker?key=${keys.nomics}&ids=${symbol}`);
    return response.json().then(json => {
        if(json.length === 0) { return null; }
        json = json[0];
        return {
            symbol: json.symbol,
            name: json.name,
            logoUrl: this.getLogoUrl(symbol),
            price: parseFloat(json.price) || null,
            change1D: parseFloat(json['1d'].price_change) || null,
            change1DPercent: parseFloat(json['1d'].price_change_pct) || null,
            change7DPercent: parseFloat(json['7d'].price_change_pct) || null,
            change30DPercent: parseFloat(json['30d'].price_change_pct) || null,
            ytdChangePercent: parseFloat(json.ytd.price_change_pct) || null,
            supply: parseInt(json.circulating_supply) || null,
            maxSupply: parseInt(json.max_supply) || null,
            marketcap: parseInt(json.market_cap) || null,
            latestUpdate: new Date(json.price_timestamp).getTime()
        };
    }).catch(err => { return null; });
}

module.exports.getLogoUrl = function(symbol) {
    return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol.toLowerCase()}.png`;
}

module.exports.getPrices = async function(symbols) { // includes currency name
    if(symbols.length === 0) { return {}; }
    let symbolsString = symbols.reduce((a, b) => a + ',' + b, '');
    let response = await fetch(`https://api.nomics.com/v1/currencies/ticker?key=${keys.nomics}&ids=${symbolsString}&interval=1d`);
    return response.json().then(json => {
        let res = {};
        for(const val of json) { 
            res[val.id] = {};
            res[val.id].price = parseFloat(val.price);
            res[val.id].name = val.name;
            res[val.id].change1D = parseFloat(val['1d'].price_change_pct);
        }
        return res;
    }).catch(err => { return {}; });
}

module.exports.getChartData = async function(coinName) {
    console.log(coinName);
    let response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinName}/market_chart?vs_currency=usd&days=365`);
    return response.json().then(json => {
        return json.prices;
    });
}