const fetch = require('node-fetch');

const keys = require('../private/keys.json');

module.exports.getStockTickers = async function(searchQuery) {
    let response = await fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${searchQuery}&apikey=${keys.alphavantage[Date.now()%keys.alphavantage.length]}`);
    return response.json().then(json => {
        if(json.bestMatches.length === 0) { return null; }
        return json.bestMatches;
    }).catch(err => { return null; });
}