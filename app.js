"use strict";

const exchanges = {
    poloniex: require('./exchanges/poloniex'),
    bitfinex: require('./exchanges/bitfinex'),
};

const logger = require('./utils/logger');
const messenger = require('./utils/messenger');
const _ = require('lodash');
const SUPPORTED_PAIRS = ['LTCBTC','ETHBTC','XRPBTC','XMRBTC','DASHBTC'];
const OPPORTUNITY_THRESHOLD_PERCENTAGE = 1;
const data = {
    prices: {},
    once: true
};

let interval = setInterval(tick, 3000);

function placeOrders(orders){
    return new Promise((resolve, reject) => {
        let short = orders[0];
        let long = orders[1];
        //pair, amount, price, side
        // exchange[short.exchangeName].order(short.pair, short.price);
        logger.log(long);
        logger.log(short);
        let message = `Placing a ${long.pair} buy order on ${long.exchangeName} at a price of ${long.price}. Placing a ${short.pair} sell order on ${short.exchangeName} at a price of ${short.price}.`;
        logger.log(message);
        resolve();
    });
}

function getOrderSize(opportunity){
    /*
    *
    * Determines the order size by retrieving the balance. The min balance from both exchanges is used.
    *
    * */
    return new Promise((resolve, reject) => {
        const balancePromises = [
            exchanges.poloniex.balance().catch(reject),
            exchanges.bitfinex.balance().catch(reject)
        ];
        // let promiseArr = deltas.map((delta) => {
        //     return exchanges[delta.exchangeName].balance();
        // });
        // Promise.all(promiseArr).then(balances => {
        //     _.each(deltas, (delta) => {
        //         delta.size = _.min(balances) * delta.price;
        //     });
        //     resolve(deltas);
        // }).catch(reject);
    });
}

function getPrices(pairs) {
    /*
    *
    * Returns the best available opportunity for arbitrage (if any). The delta is calculated as:
    *
    *   100 - (longExchange.lowestAsk / shortExchange.highestBid)
    *
    * because those are the prices that orders are most likely to be filled at.
    *
    * args:
    *
    *   ['LTCBTC','ETHBTC','XRPBTC','XMRBTC','DASHBTC']
    *
    * return:
    *
    *   {
    *       pair: 'ETHUSD'
    *       shortExchange: 'poloniex',
    *       longExchange: 'bitfinex',
    *       shortExchangeAsk: 322,
    *       shortExchangeBid: 320,
    *       shortExchangeMid: 321,
    *       longExchangeAsk: 305,
    *       longExchangeBid: 301,
    *       longExchangeMid: 303,
    *       delta: 4.68,
    *   }
    *
    * */
    // logger.log('pairs: ' + JSON.stringify(pairs));
    return new Promise((resolve, reject) => {
        const pricePromises = [
            exchanges.poloniex.tick(pairs).catch(reject),
            exchanges.bitfinex.tick(pairs).catch(reject)
        ];
        Promise.all(pricePromises).then(prices => {
            let opportunity = {};
            let poloniexPrices = prices[0];
            let bitfinexPrices = prices[1];
            // prices = [{exchange: 'bitfinex', pair: 'ETHUSD', ask: 312, bid: 310, mid: 311}, {exchange: 'bitfinex', pair: 'LTCUSD', ask: 46, bid: 44, mid: 45}, {exchange: 'bitfinex', pair: 'BTCUSD', ask: 3800, bid: 3700, mid: 3750}]
            _.each(poloniexPrices, (poloniexPrice) =>{
                _.each(bitfinexPrices, (bitfinexPrice) =>{
                    if(poloniexPrice.pair === bitfinexPrice.pair){
                        let ordered =_.sortBy([poloniexPrice, bitfinexPrice], ['mid']);
                        let longExchange = ordered[0];
                        let shortExchange = ordered[1];
                        let delta = parseFloat(100 - (longExchange.ask / shortExchange.bid * 100)).toFixed(2);
                        if ( delta > OPPORTUNITY_THRESHOLD_PERCENTAGE ){
                            if((res && (res.delta < delta)) || _.isEmpty(res)){
                                opportunity = {
                                    pair: 'ETHUSD',
                                    shortExchange: shortExchange.exchange,
                                    longExchange: longExchange.exchange,
                                    shortExchangeAsk: shortExchange.ask,
                                    shortExchangeBid: shortExchange.bid,
                                    shortExchangeMid: shortExchange.mid,
                                    longExchangeAsk: longExchange.ask,
                                    longExchangeBid: longExchange.bid,
                                    longExchangeMid: longExchange.mid,
                                    delta: delta,
                                }
                            }
                        }
                    }
                })
            });
            if(_.isEmpty(opportunity)){
                reject('No opportunity.')
            }
            else{
                resolve(opportunity);
            }
        });
    });
}

function tick(){

    getPrices(SUPPORTED_PAIRS).then(getOrderSize).then(logger.log).catch(logger.error);

    // getPrices(SUPPORTED_PAIRS).then(deltaCheck).then(firstOpportunityCheck).then(secondOpportunityCheck).then(getOrderSize).then(placeOrders).then(messenger.broadcast).catch(logger.error);
    // getPrices(SUPPORTED_PAIRS).then(deltaCheck).then(firstOpportunityCheck).then(secondOpportunityCheck).then(messenger.broadcast).catch(logger.error);
}