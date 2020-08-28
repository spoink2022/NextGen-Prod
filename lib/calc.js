module.exports.round = function(num, decimals) {
    return parseFloat(num.toFixed(decimals));
}

module.exports.percentChange = function(start, end) {
    let diff = end - start;
    return (diff / start) * 100;
}

module.exports.dollarChange = function(start, end, qt=1) {
    return (end - start) * qt;
}