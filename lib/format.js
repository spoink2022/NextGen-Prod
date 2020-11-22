module.exports.dollarValue = function(num, decimals) {
    if(num === 0) { return '$0.00000000'.substring(0, decimals+3); }
    if(!num) { return 'No Data'; }
    let whole = `${num<0 ? '-' : ''}$${Math.floor(Math.abs(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    let decimal = Number.isInteger(num) ? '.00000000'.substring(0, decimals+1) : `.${(Math.abs(num) - Math.floor(Math.abs(num))).toFixed(decimals).substring(2)}00000000`.substring(0, decimals+1);
    if(decimals === 0) { decimal = ''; }
    return whole + decimal;
}

module.exports.percentageValue = function(num, decimals, forcePlus=false) {
    if(num === 0) { return '0.00000000'.substring(0, decimals+2) + '%'; }
    num = num ? `${(num.toFixed(decimals)+'00000000').substring(0, Math.floor(num).toString().length + decimals+1)}%` : 'No Data';
    if(forcePlus && !(num.substring(0, 1) === '-')) { num = '+' + num; }
    return num;
}

module.exports.floatValue = function(num, decimals, forceDecimalLength=true) {
    if(num === 0) { return '0'}
    if(!num) { return 'No Data'; }
    let whole = `${num<0 ? '-' : ''}${Math.floor(Math.abs(num)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    let decimal = Number.isInteger(num) ? '' : `.${(num - Math.floor(num)).toFixed(decimals).substring(2)}`;
    if(!forceDecimalLength && !Number.isInteger(num)) { decimal = '.' + parseFloat('0.' + decimal.substring(1)).toString().substring(2); }
    return whole + decimal;
}

module.exports.intValue = function(num) {
    return num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') : 'No Data';
}

module.exports.padWithDashes = function(str, maxLen) {
    const dashes = Math.max(Math.round((maxLen - str.length) / 6), 0);
    return ' - '.repeat(dashes) + str + ' - '.repeat(dashes);
}