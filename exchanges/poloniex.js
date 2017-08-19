module.exports = (function() {
    "use strict";
    const SETTINGS = require('./config')['POLONIEX'];
    const Promise = require('promise');
    const Poloniex = require('poloniex-api-node');
    const poloniex = new Poloniex(SETTINGS.API_KEY, SETTINGS.API_SECRET);
    const _ = require('lodash');
    const logger = require('../utils/logger');
    const devMode = process.argv.includes('dev');
    let bitcoinBalance, prices = {};
    return {
        tick: (pairArray) => {
            /*
            *
            * Returns an array of price values corresponding to the pairArray provided. e.g.
            *
            * args:
            * ['ETHUSD', 'LTCUSD', 'BTCUSD']
            *
            * return:
            * [{exchange: 'poloniex', pair: 'ETHUSD', ask: 312, bid: 310, mid: 311}, {exchange: 'poloniex', pair: 'LTCUSD', ask: 46, bid: 44, mid: 45}, {exchange: 'poloniex', pair: 'BTCUSD', ask: 3800, bid: 3700, mid: 3750}]
            *
            * */
            return new Promise((resolve, reject) => {
                poloniex.returnTicker((err, data) => {
                    if(!err && !data.error){
                        resolve(pairArray.map(pair => {
                            let coin = data[SETTINGS.COINS[pair]];
                            return {
                                exchange: 'poloniex',
                                pair: pair,
                                ask: parseFloat(coin.lowestAsk),
                                bid: parseFloat(coin.highestBid),
                                mid: parseFloat(((parseFloat(coin.lowestAsk) + parseFloat(coin.highestBid))/2))
                            };
                        }));
                    }
                    else{
                        logger.error('Poloniex');
                        reject(err || _.get('data.error'));
                    }
                });
            });
        },
        balance(pair) {
            /*
            *
            * Returns a single float value of approximate balance of the selected coin. e.g.
            *
            * args:
            * 'LTC'
            *
            * returns:
            * 1.235
            *
            * */
            return new Promise((resolve, reject) => {
                if(_.isNumber(bitcoinBalance)) {
                    let pairPriceInBitcoin = _.find(prices, {pair: pair}).mid;
                    let coinBalance = parseFloat( bitcoinBalance / pairPriceInBitcoin );
                    resolve(coinBalance);
                }
                else{
                    reject(`Bitfinex could retrieve the balance`)
                }
            });
        },
        order(pair, amount, price, side) {
            /*
            *
            * Place an order
            *
            * */
            return new Promise((resolve, reject) => {
                poloniex[side==='buy'?'marginBuy':'marginSell'](SETTINGS.COINS[pair], price, amount, null , (err, data) => {
                    if(!err){
                        resolve(data);
                    }
                    else{
                        reject(err || _.get('data.error'));
                    }
                });
            });
        },
        init: function(){
            /*
            *
            * Initiating the exchange will start the ticker and also retrieve the balance for trading.
            * It returns a simple success message (String)
            *
            * */
            const that = this;
            return new Promise((resolve, reject) => {
                that.tick(Object.keys(SETTINGS.COINS)).then(_prices => {
                    prices = _prices;
                    poloniex.returnMarginAccountSummary((err, data) => {
                        if (!err && !data.error) {
                            // {"totalValue":"0.01761446","pl":"0.00000000","lendingFees":"0.00000000","netValue":"0.01761446","totalBorrowedValue":"0.00000000","currentMargin":"1.00000000"}
                            bitcoinBalance = parseFloat(data.totalValue);
                            resolve(`Successfully initiated poloniex. Your balance is: ${bitcoinBalance} Bitcoin. `);
                        }
                        else{
                            reject(`Poloniex couldn't retrieve the balance`);
                        }
                    });
                }).catch(reject);
            });
        }
    };

})();