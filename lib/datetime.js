const closedDays = require('../static/closedDays.json');

const offsetEST = -4;

// ________________________________________ USED INTERNALLY / EXTERNALLY ________________________________________
module.exports.monthList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

module.exports.pad = function(num) {
    return num<10 ? '0'+num : num;
}

module.exports.rankFormat = function(num) {
    if(num <= 0) { return null; }
    // _teen numbers end in th
    if(num % 100 > 10 && num % 100 < 20) { return num+'th'; }
    return num % 10 === 1 ? num+'st' : num % 10 === 2 ? num+'nd' : num % 10 === 3 ? num+'rd' : num+'th';
}
// ________________________________________ USED EXTERNALLY ONLY (all in EST) ________________________________________
module.exports.getEpochEST = function() {
    let offset = 1000 * 60 * 60 * offsetEST;
    return Date.now() + offset;
}

module.exports.getEpochHoursEST = function() {
    return Math.floor(this.getEpochEST() / (1000 * 60 * 60));
}

module.exports.epochToEpochEST = function(epoch) {
    let offset = 1000 * 60 * 60 * offsetEST;
    return epoch + offset;
}

module.exports.epochToDateString = function(epoch, year=false) {
    let d = new Date(epoch);
    let hours = d.getUTCHours()>12 ? d.getUTCHours()-12 : d.getUTCHours()===0 ? 12 : d.getUTCHours();
    let periodOfDay = d.getUTCHours()<12 ? 'AM' : 'PM';
    return `${year ? d.getUTCFullYear()+' ' : ''}${this.monthList[d.getUTCMonth()]} ${this.rankFormat(d.getUTCDate())} ${hours}:${this.pad(d.getUTCMinutes())} ${periodOfDay}`;
}

module.exports.epochToDateJoined = function(epoch) {
    let d = new Date(epoch);
    return `${this.monthList[d.getUTCMonth()]} ${this.rankFormat(d.getUTCDate())}, ${d.getUTCFullYear()}`;
}

module.exports.currentDayDashedString = function() { // 2020-01-01
    let d = new Date(this.getEpochEST());
    return `${d.getUTCFullYear()}-${this.pad(d.getUTCMonth()+1)}-${this.pad(d.getUTCDate())}`;
}

module.exports.currentTimeString = function() { // 16:01:10
    let d = new Date(this.getEpochEST());
    return `${d.getUTCHours()}:${this.pad(d.getUTCMinutes())}:${this.pad(d.getUTCSeconds())}`;
}

// boolean

module.exports.isMarketOpen = function() {
    console.log(!closedDays.includes(this.currentDayDashedString()));
    let d = new Date(this.getEpochEST());
    const marketOpenToday = !([6, 0].includes(d.getUTCDay())) && !closedDays.includes(this.currentDayDashedString()); // 6=saturday, 0=sunday
    let minutes = d.getUTCHours()*60 + d.getUTCMinutes();
    const timeOfDayGood = minutes >= 570 && minutes <= 960; // 570=9:30, 960=16:00 // daylight savings +60
    return marketOpenToday && timeOfDayGood;
}

module.exports.canHandleBuyOrders = function() {
    let d = new Date(this.getEpochEST());
    const marketOpenToday = !([6, 0].includes(d.getUTCDay()) && !closedDays.includes(this.currentDayDashedString())); // 6=saturday, 0=sunday
    let minutes = d.getUTCHours()*60 + d.getUTCMinutes(); 
    const timeOfDayGood = minutes >= 580 && minutes <= 960; // 580=9:40 (10 minutes to allow stock), 960=16:00
    return marketOpenToday && timeOfDayGood;
}

module.exports.isPastLeaderboardPostTime = function() {
    const POST_TIME = 1080; // 6:00pm, or 18:00
    let d = new Date(this.getEpochEST());
    let minutes = d.getUTCHours()*60 + d.getUTCMinutes();
    return minutes >= POST_TIME;
}

module.exports.parseDashedString = function(d) { // 2020-08-25 19:30:00
    let dSplit = d.split(' ');
    let y = dSplit[0].split('-');
    let h = dSplit[1].split(':');
    return Date.UTC(y[0], parseInt(y[1])-1, y[2], h[0], h[1], h[2]);
}