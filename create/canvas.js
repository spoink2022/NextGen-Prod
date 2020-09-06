const { createCanvas, loadImage, registerFont } = require('canvas');
registerFont('lib/fonts/Montserrat-Regular.ttf', {family: 'Arial'}); // until i figure out how to choose fonts, montserrat will be the Arial/default
const { CanvasRenderService } = require('chartjs-node-canvas');

const format = require('../lib/format.js');

const cryptoInfoRenderService = new CanvasRenderService(900, 340);

function renderCryptoInfo(configuration) {
    return cryptoInfoRenderService.renderToBuffer(configuration);
}

module.exports.stockGraph = async function(ticker) {
    const canvas = createCanvas(900, 340);
    const ctx = canvas.getContext('2d');
    const url = 'https://finviz.com/chart.ashx?t=' + ticker + '&ty=l&ta=1&p=d&s=l';
    const background = await loadImage(url);

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    return canvas;
}

module.exports.cryptoGraph = async function(symbol, data, up) {
    data = data.map(function(tuple) {
        return {t: new Date(tuple[0]), y: tuple[1]}
    });

    const configuration = {
        type: 'line',
        data: {
            datasets: [{
                label: symbol.toUpperCase() + '/USD',
                pointBorderColor: 'rgba(0, 0, 0, 0)',
                borderColor: up ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)',
                borderWidth: 3,
                data: data
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: "time",
                    time: {
                        unit: 'month'
                    },
                    scaleLabel: {
                        display: true,
                        labelString: 'Date'
                    },
                    gridLines: {
                        color: 'rgba(128, 128, 128, 0.2)'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Price ($)'
                    },
                    ticks: {
                        beginAtZero: false,
                        callback: (value) => format.floatValue(value, 6, false)
                    },
                    gridLines: {
                        color: 'rgba(128, 128, 128, 0.2)'
                    }
                }],
            }
        }
    }
    return await renderCryptoInfo(configuration);
}