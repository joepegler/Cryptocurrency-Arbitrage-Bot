module.exports = (function() {
    "use strict";

    const SETTINGS = require('./config')['POLONIEX'];
    const Promise = require('promise');
    const Poloniex = require('poloniex-api-node');
    const poloniex = new Poloniex(SETTINGS.API_KEY, SETTINGS.API_SECRET);
    const _ = require('lodash');
    const logger = require('../utils/logger');

    const devMode = process.argv.includes('dev');
    let testDelta = 20, res = {};

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
                                ask: parseFloat(coin.lowestAsk).toFixed(7),
                                bid: parseFloat(coin.highestBid).toFixed(7),
                                mid: parseFloat((parseFloat(coin.lowestAsk) + parseFloat(coin.highestBid))/2).toFixed(7)
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
        balance(){
            /*
            *
            * Returns a single float value of balance in bitcoin. e.g.
            *
            * 1.235
            *
            * */
            return new Promise((resolve, reject) => {
                poloniex.returnMarginAccountSummary((err, data) => {
                    if(!err && !data.error){
                        try {
                            resolve(parseFloat(data.totalValue).toFixed(7));
                        }
                        catch(e){
                            reject(e);
                        }
                    }
                    else{
                        reject(err || _.get('data.error'));
                    }
                })
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
        }
    }
})();