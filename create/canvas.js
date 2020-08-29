const { createCanvas, loadImage } = require('canvas');

module.exports.stockGraph = async function(ticker) {
    const canvas = createCanvas(900, 340);
    const ctx = canvas.getContext('2d');
    const url = 'https://finviz.com/chart.ashx?t=' + ticker + '&ty=l&ta=1&p=d&s=l';
    const background = await loadImage(url);

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    return canvas;
}