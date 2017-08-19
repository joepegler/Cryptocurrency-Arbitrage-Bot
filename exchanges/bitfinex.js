module.exports = (function() {
    "use strict";

    const SETTINGS = require('./config')['BITFINEX'];
    const Promise = require('promise');
    const _ = require('lodash');
    const BFX = require('bitfinex-api-node');
    const logger = require('../utils/logger');
    const bitfinex = new BFX(SETTINGS.API_KEY, SETTINGS.API_SECRET, {version: 1, transform: true}).rest;
    const bitfinex_websocket = new BFX('', '', { version: 2, transform: true }).ws;
    const devMode = process.argv.includes('dev');
    let prices = {}, dollarBalance = 0;

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
            return new Promise((resolve) => {
                resolve(pairArray.map(pair => {return prices[pair];}));
            });
        },
        balance(pair) {
            /*
            *
            * Returns a single float value of approximate balance of the selected coin.
            * It is slightly adjust to give a margin of error for the exchange rate e.g.
            *
            * args:
            * 'LTC'
            *
            * returns:
            * 1.235
            *
            * */
            return new Promise((resolve, reject) => {
                if(_.isNumber(dollarBalance)) {
                    // For bitfinex we must translate the price to bitcoin first.
                    let bitcoinPrice = _.find(prices, {pair: 'BTCUSD'}).mid;
                    let pairPriceInBitcoin = _.find(prices, {pair: pair}).mid;
                    let bitcoinBalance = parseFloat( dollarBalance / bitcoinPrice );
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
                // [symbol, amount, price, exchange, side, type, is_hidden, postOnly, cb]
                bitfinex.new_order(SETTINGS.COINS[pair], amount.toFixed(7), price.toFixed(9), 'bitfinex', side, 'limit', (err, data) => {
                    if (!err) {
                        // {"id":3341017504,"cid":1488258364,"cid_date":"2017-08-13","gid":null,"symbol":"ethbtc","exchange":"bitfinex","price":"0.078872","avg_execution_price":"0.0","side":"sell","type":"limit","timestamp":"1502583888.325827284","is_live":true,"is_cancelled":false,"is_hidden":false,"oco_order":null,"was_forced":false,"original_amount":"0.01","remaining_amount":"0.01","executed_amount":"0.0","src":"api","order_id":3341017504}
                        resolve(data);
                    }
                    else {
                        logger.error(err);
                        reject(err);
                    }
                });
            });
        },
        init(){
            /*
            *
            * Initiating the exchange will start the ticker and also retrieve the balance for trading.
            * It returns a simple success message (String)
            *
            * */
            let once;
            return new Promise((resolve, reject) => {
                const invertedMap = (_.invert(SETTINGS.COINS));
                bitfinex_websocket.on('open', () => {
                    _.each(SETTINGS.COINS, pair => {
                        bitfinex_websocket.subscribeTicker(pair);
                    });
                    bitfinex_websocket.on('ticker', (ePair, ticker) => {
                        let pair = invertedMap[ePair.substring(1)];
                        prices[pair] = {
                            exchange: 'bitfinex',
                            pair: pair,
                            ask: parseFloat(ticker.ASK) + (devMode ? (parseFloat(ticker.ASK) * .02) : 0),
                            bid: parseFloat(ticker.BID) + (devMode ? (parseFloat(ticker.ASK) * .02) : 0),
                            mid: parseFloat((parseFloat(ticker.ASK) + parseFloat(ticker.BID)) / 2)
                        };
                        if (!once) {
                            once = true;
                            bitfinex.margin_infos((err, data) => {
                                if (!err) {
                                    try {
                                        //[{"margin_balance":"72.84839221","tradable_balance":"182.120980525","unrealized_pl":"0.0","unrealized_swap":"0.0","net_value":"72.84839221","required_margin":"0.0","leverage":"2.5","margin_requirement":"13.0","margin_limits":[{"on_pair":"BTCUSD","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"LTCUSD","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"LTCBTC","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"233.895656370333333333"},{"on_pair":"ETHUSD","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"ETHBTC","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"233.895656370333333333"},{"on_pair":"ETCBTC","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"233.895656370333333333"},{"on_pair":"ETCUSD","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"ZECUSD","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"ZECBTC","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"233.895656370333333333"},{"on_pair":"XMRUSD","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"XMRBTC","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"233.895656370333333333"},{"on_pair":"DSHUSD","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"DSHBTC","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"233.895656370333333333"},{"on_pair":"IOTUSD","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"IOTBTC","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"233.895656370333333333"},{"on_pair":"IOTETH","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"EOSUSD","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"EOSBTC","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"233.895656370333333333"},{"on_pair":"EOSETH","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"OMGUSD","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"OMGBTC","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"233.895656370333333333"},{"on_pair":"OMGETH","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"BCHUSD","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"},{"on_pair":"BCHBTC","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"233.895656370333333333"},{"on_pair":"BCHETH","initial_margin":"30.0","margin_requirement":"15.0","tradable_balance":"220.973456370333333333"}],"message":"Margin requirement, leverage and tradable balance are now per pair. Values displayed in the root of the JSON message are incorrect (deprecated). You will find the correct ones under margin_limits, for each pair. Please update your code as soon as possible."}]
                                        dollarBalance = parseFloat(data[0].margin_balance);
                                        resolve(`Successfully initiated bitfinex. Your balance is: ${dollarBalance} Dollars. `);
                                    }
                                    catch (e) {
                                        reject(e);
                                    }
                                }
                                else {
                                    reject(err);
                                }
                            });
                        }
                    });
                });
            });
        }
    };
})();