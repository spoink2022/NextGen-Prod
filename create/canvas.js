const { createCanvas, loadImage, registerFont } = require('canvas');
registerFont('lib/fonts/Montserrat-Regular.ttf', {family: 'Arial'}); // until i figure out how to choose fonts, montserrat will be the Arial/default
const { CanvasRenderService } = require('chartjs-node-canvas');

const datetime = require('../lib/datetime.js');
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
        return {t: new Date(tuple[0]), y: tuple[1]};
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

module.exports.event = {};

// STOCK PICK #1
module.exports.event.stockPickGraph = async function(chartData, chartData2, up, up2, ticker, ticker2) {
    const configuration = {
        type: 'line',
        data: {
            datasets: [{
                label: null,
                pointBorderColor: 'rgba(0, 0, 0, 0)',
                pointBackgroundColor: 'rgba(0, 0, 0, 0)',
                borderWidth: 3,
                lineTension: 0.1,
                data: null
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: "time",
                    time: {
                        unit: 'day'
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
    const canvas = createCanvas(900, 780);
    const ctx = canvas.getContext('2d');

    let c = configuration;
    c.data.datasets[0].data = chartData;
    c.data.datasets[0].borderColor = up ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    c.data.datasets[0].label = ticker + ' share value';
    const graph1 = await loadImage(await renderCryptoInfo(c));
    ctx.drawImage(graph1, 0, 20, canvas.width, 340);
    ctx.font = '40px Arial';
    ctx.fillStyle = '#dddddd';
    ctx.fillText(ticker, 90, 35);

    c = configuration;
    c.data.datasets[0].data = chartData2;
    c.data.datasets[0].borderColor = up2 ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    c.data.datasets[0].label = ticker2 + ' share value';
    const graph2 = await loadImage(await renderCryptoInfo(c));
    ctx.drawImage(graph2, 0, canvas.height/2 + 20, canvas.width, 340);
    ctx.fillText(ticker2, 90, canvas.height/2 + 35);

    return canvas.toBuffer();
}

// CRYPTO PICK #1
module.exports.event.cryptoPickGraph = async function(chartData, chartData2, chartData3, symbol, symbol2, symbol3) {
    const configuration = {
        type: 'line',
        data: {
            datasets: [{
                label: null,
                pointBorderColor: 'rgba(0, 0, 0, 0)',
                pointBackgroundColor: 'rgba(0, 0, 0, 0)',
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderWidth: 2,
                lineTension: 0.1,
                data: null
            },
            {
                label: null,
                pointBorderColor: 'rgba(0, 0, 0, 0)',
                pointBackgroundColor: 'rgba(0, 0, 0, 0)',
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderWidth: 2,
                lineTension: 0.1,
                data: null
            },
            {
                label: null,
                pointBorderColor: 'rgba(0, 0, 0, 0)',
                pointBackgroundColor: 'rgba(0, 0, 0, 0)',
                backgroundColor: 'rgba(0, 0, 0, 0)',
                borderWidth: 2,
                lineTension: 0.1,
                data: null
            }
        ]
        },
        options: {
            scales: {
                xAxes: [{
                    type: "time",
                    time: {
                        unit: 'day'
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
                        labelString: 'Change (%)'
                    },
                    ticks: {
                        beginAtZero: false,
                        callback: (value) => format.percentageValue(value, 1, true)
                    },
                    gridLines: {
                        color: 'rgba(128, 128, 128, 0.2)'
                    }
                }],
            }
        }
    }
    const canvas = createCanvas(900, 400);
    const ctx = canvas.getContext('2d');

    let c = configuration;
    c.data.datasets[0].data = chartData;
    c.data.datasets[0].borderColor = 'rgba(255, 159, 0, 1)';
    c.data.datasets[0].label = symbol;
    c.data.datasets[1].data = chartData2;
    c.data.datasets[1].borderColor = 'rgba(21, 171, 0, 1)';
    c.data.datasets[1].label = symbol2;
    c.data.datasets[2].data = chartData3;
    c.data.datasets[2].borderColor = 'rgba(0, 59, 174, 1)';
    c.data.datasets[2].label = symbol3;
    const graph1 = await loadImage(await renderCryptoInfo(c));
    ctx.drawImage(graph1, 0, 50, canvas.width, 340);
    ctx.font = '40px Arial';
    ctx.fillStyle = '#dddddd';
    ctx.fillText(`${symbol}, ${symbol2}, ${symbol3}`, 40, 35);

    return canvas.toBuffer();
}