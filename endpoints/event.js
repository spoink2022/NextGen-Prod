const fetch = require('node-fetch');
const parse = require('csv-parse/lib/sync');

const keys = require('../private/keys.json');

function getOne(arr) {
    return arr[Math.floor(Math.random()*arr.length)];
}

module.exports.getChartDataStockPick = async function(ticker, startDay) {
    const key = getOne(keys.alphavantage);
    console.log(key);
    let response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker.replace('.', '-')}&interval=60min&outputsize=full&apikey=${key}&datatype=csv`);
    return response.text().then(async(text) => {
        let startDate = (new Date(startDay)).getTime();
        try { var json = await parse(text, {
            on_record: (record, {lines}) => {
                record = lines===1 ? null : {t: record[0], y: record[4]};
                if(record && parseInt(record.t) <= startDate) { return null; }
                return record;
            },
            skip_empty_lines: true
        });
        } catch { console.log(text); }
        // IEX Addition (most recent day)
        let response = await fetch(`https://cloud.iexapis.com/stable/stock/${ticker}/intraday-prices?chartIEXOnly=true&chartInterval=60&token=${keys.IEXCloud}`);
        return response.json().then(iexJson => {
            let latestAlphavantageDate = json[0] ? json[0].t : 0;
            for(const obj of iexJson) {
                if(!obj.close) { continue; }
                let year = obj.date.split('-')[0], month=parseInt(obj.date.split('-')[1])-1, day = obj.date.split('-')[2];
                let hour = obj.minute.split(':')[0], minute = obj.minute.split(':')[1];
                let entry = {t: Date.UTC(year, month, day, hour, minute, 0), y: obj.close};
                if(parseInt(entry.t) >= latestAlphavantageDate) {
                    json.unshift(entry);
                }
            }
            return json;
        });
    });
    //response = 
}