module.exports.dollarValue = function(num, decimals) {
    if(num === 0) { return '$0.00000000'.substring(0, decimals+3); }
    if(!num) { return 'No Data'; }
    let whole = `${num<0 ? '-' : ''}$${Math.floor(Math.abs(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    let decimal = Number.isInteger(num) ? '.00000000'.substring(0, decimals+1) : `.${(Math.abs(num) - Math.floor(Math.abs(num))).toFixed(decimals).substring(2)}00000000`.substring(0, decimals+1);
    if(decimals === 0) { decimal = ''; }
    return whole + decimal;
}

module.exports.percentageValue = function(num, decimals) {
    if(num === 0) { return '0.00000000'.substring(0, decimals+2) + '%'; }
    return num ? `${(num.toFixed(decimals)+'00000000').substring(0, Math.floor(num).toString().length + decimals+1)}%` : 'No Data';
}

module.exports.floatValue = function(num, decimals) {
    if(num === 0) { return '0'}
    if(!num) { return 'No Data'; }
    let whole = `${num<0 ? '-' : ''}${Math.floor(Math.abs(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    let decimal = Number.isInteger(num) ? '' : `.${(num - Math.floor(num)).toFixed(decimals).substring(2)}`;
    return whole + decimal;
}

module.exports.intValue = function(num) {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'No Data';
}

