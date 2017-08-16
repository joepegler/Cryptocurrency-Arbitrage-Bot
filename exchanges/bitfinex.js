module.exports = (function() {
    "use strict";

    const SETTINGS = require('./config')['BITFINEX'];
    const Promise = require('promise');
    const _ = require('lodash');
    const BFX = require('bitfinex-api-node');
    const logger = require('../utils/logger');
    const bitfinex = new BFX(SETTINGS.API_KEY, SETTINGS.API_SECRET, {version: 1, transform: true}).rest;
    const bitfinex_websocket = new BFX('', '', { version: 2, transform: true }).ws;

    let res = {};
    (function init(){
        const invertedMap = (_.invert(SETTINGS.COINS));
        bitfinex_websocket.on('open', () => {
            _.each(SETTINGS.COINS, pair => {
                bitfinex_websocket.subscribeTicker(pair);
            });
            bitfinex_websocket.on('ticker', (ePair, ticker) => {
                let pair = invertedMap[ePair.substring(1)];
                res[pair] = {
                    exchange: 'bitfinex',
                    pair: pair,
                    ask: parseFloat(ticker.ASK).toFixed(7),
                    bid: parseFloat(ticker.BID).toFixed(7),
                    mid: parseFloat((parseFloat(ticker.ASK) + parseFloat(ticker.BID))/2).toFixed(7)
                };
            });
        });
    }());

    return {
        tick: (pairArray) => {
            /*
            *
            * Returns an array of price values corresponding to the pairArray provided. e.g.
            *
            * args:
            * ['ETHUSD', 'LTCUSD', 'BTCUSD']
            *
            * returns:
            * [{exchange: 'bitfinex', pair: 'ETHUSD', ask: 312, bid: 310, mid: 311}, {exchange: 'bitfinex', pair: 'LTCUSD', ask: 46, bid: 44, mid: 45}, {exchange: 'bitfinex', pair: 'BTCUSD', ask: 3800, bid: 3700, mid: 3750}]
            *
            * */
            return new Promise((resolve, reject) => {
                resolve(pairArray.map(pair => {return res[pair];}));
            });
        },
        balance() {
            /*
            *
            * Returns a single float value of approximate balance in bitcoin. e.g.
            *
            * 1.235
            *
            * */
            return new Promise((resolve, reject) => {
                bitfinex.margin_infos((err, balances) => {
                    if (!err) {
                        try {
                            resolve(parseFloat( balances[0].margin_balance / res['BTCUSD'].mid  ).toFixed(7))
                        }
                        catch (e) {
                            reject(e);
                        }
                    }
                    else {
                        reject(err);
                    }
                });
            });
        },
        order(pair, amount, price, side) {
            /*
            *
            * Place an order
            *
            * */
            return new Promise((resolve, reject) => {
                logger.log('Ordering now: ');
                //symbol, amount, price, exchange, side, type, is_hidden, postOnly, cb
                bitfinex.new_order(SETTINGS.COINS[pair], amount, price, 'bitfinex', side, 'limit', (err, data) => {
                    if (!err) {
                        // {"id":3341017504,"cid":1488258364,"cid_date":"2017-08-13","gid":null,"symbol":"ethbtc","exchange":"bitfinex","price":"0.078872","avg_execution_price":"0.0","side":"sell","type":"limit","timestamp":"1502583888.325827284","is_live":true,"is_cancelled":false,"is_hidden":false,"oco_order":null,"was_forced":false,"original_amount":"0.01","remaining_amount":"0.01","executed_amount":"0.0","src":"api","order_id":3341017504}
                        resolve(data);
                    }
                    else {
                        reject(err);
                    }
                });

            });
        }
    };
})();