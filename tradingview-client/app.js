const TradingView = require('@mathieuc/tradingview');

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
} 

async function evaluate (config, callback) {

    // Creates a websocket client with session
    let client = new TradingView.Client();
    let chart = new client.Session.Chart();

    // Set the market
    chart.setMarket(config.paircode, {
      	timeframe: config.timeframe,
    });

    chart.onError((...err) => { // Listen for errors (can avoid crash)
      	console.error('Tradingbot error:', ...err);
      	// Do something...
    });

    let indicator = await TradingView.getIndicator(config.activeIndicator);

    // setting parameter
    for (let x=0; x<config.params.length; x++) {
    	indicator.setOption(x, config.params[x]);
    }

    let strategy = new chart.Study(indicator);
    strategy.onUpdate( async () => {
        let report = `${config.paircode}\t`;

        if (typeof strategy.strategyReport.performance.all != 'undefined'){
            let profitableTrades = (strategy.strategyReport.performance.all.percentProfitable*100).toFixed(1);
            let profitPercent = (strategy.strategyReport.performance.all.netProfitPercent*100).toFixed(1);

            report += `\t${strategy.strategyReport.performance.all.totalTrades}`;
            report += `\t${profitableTrades}%`;
            report += `\t\t${profitPercent}%`;
        }

        await strategy.remove();
        await chart.delete();
        await client.end();

        callback(report);
    });
}

async function analisa(config, symbols) {
    console.log('TICKER\t\t\tTrades\tProfitable\tProfit %');
    for (let i=0; i<symbols.length; i++) {
        try {
            config.paircode = symbols[i];
            await evaluate(config, (data) => {
                console.log(data);
            });
            await delay(3000);
        } catch (error) {
            console.log(`${symbols[i]}: Not supported`);
            console.log(error.toString());
        }
    }
}


let config = {
    paircode: null,
    
    // timeframe
    timeframe: '1',
    
    // kode strategy
    activeIndicator: 'STD;MACD%1Strategy',
    
    // parameter tambahan
    params: [],
};


let assets = [
    'BINANCE:BTCUSDT',
    'BINANCE:TRXUSDT',
    'BINANCE:XRPUSDT',
    'BINANCE:GMTUSDT',
    'BINANCE:HBARUSDT',
    'BINANCE:XLMUSDT',
    'BINANCE:GALAUSDT',
    'BINANCE:MANAUSDT',
    'BYBIT:BTCUSDT',
];

analisa(config, assets);
