"use strict";

const poloniex = require('./exchanges/poloniex');
const bitfinex = require('./exchanges/bitfinex');

const prompt = require('prompt');
const logger = require('./utils/logger');
const Promise = require('promise');

const SUPPORTED_PAIRS = ['BTCUSD', 'LTCBTC','ETHBTC','XRPBTC','XMRBTC','DASHBTC'];
const devMode = process.argv.includes('dev');
// devMode && logger.log('Development mode: ' + devMode);

prompt.start();

function win(message){
    logger.log(message);
    getUserInput();
}

function fail(message){
    logger.error(message);
    getUserInput();
}

function getUserInput(){
    logger.log('\nPick an action: \n1) Ticker\n2) Balance\n3) Order\n4) Back\n5) Quit');
    prompt.get(['action'], function (err, res) {
        if (!err) {
            switch(parseInt(res.action)){
                case 1:
                    chooseExchange().then(exchange => {
                        logger.log('Getting price for following pairs: ' + JSON.stringify(SUPPORTED_PAIRS));
                        exchange.tick(SUPPORTED_PAIRS).then(win).catch(fail);
                    }).catch(fail);
                    break;
                case 2:
                    chooseExchange().then(exchange => {
                        logger.log('Getting balance.');
                        choosePair().then(pair => {
                            logger.log('Pair selected: ' + pair);
                            exchange.balance(pair).then(win).catch(fail);
                        }).catch(fail);
                    }).catch(fail);
                    break;
                case 3:
                    logger.log('Placing an order');
                    chooseExchange().then(exchange => {
                        logger.log('Selected ' + exchange.exchange);
                        choosePair().then(pair => {
                            logger.log('Pair selected: ' + pair);
                            exchange.tick([pair]).then(priceArr => {
                                logger.log('Got price for this coin: ' + JSON.stringify(priceArr));
                                exchange.balance(pair).then(coinBalance => {
                                    logger.log('Retrieved coin balance: ' + coinBalance);
                                    longOrShort().then(longOrShort => {
                                        let price = longOrShort === 'buy' ? priceArr[0].bid : priceArr[0].ask;
                                        logger.log('Place a margin ' + longOrShort + ' order. ');
                                        confirm().then(yesNo => {
                                            if (yesNo === 'yes'){
                                                // pair, amount, price, side
                                                // exchange.order(pair, coinBalance, , 'buy').then(win).catch(fail);
                                                let message = `\nPair: ${pair}. \nAmount: ${coinBalance}. \nPrice: ${price}. \nBuyOrSell: ${longOrShort}\n`;
                                                win(message)
                                            }
                                            else{
                                                fail();
                                            }
                                        }).catch(fail)
                                    }).catch(fail);
                                }).catch(fail);
                            }).catch(fail);
                        }).catch(fail);
                    }).catch(fail);
                    break;
                case 4:
                    win('Choose Again...');
                    break;
                case 5:
                    process.exit();
                    break;
                default:
                    fail('Invalid choice');
            }
        }
        else{
            fail(err);
        }
    });
}

function chooseExchange(){
    return new Promise((resolve, reject) => {
        logger.log('\nPick an exchange: \n1) Poloniex\n2) Bitfinex\n3) Back\n4) Quit');
        prompt.get(['exchange'], (err, res) => {
            if (!err && res.exchange) {
                switch (parseInt(res.exchange)){
                    case 1:
                        return resolve(poloniex);
                        break;
                    case 2:
                        return resolve(bitfinex);
                        break;
                    case 3:
                        reject('Choose Again...');
                        break;
                    case 4:
                        process.exit();
                        break;
                    default:
                        reject('Invalid choice');
                }
            }
        });
    });
}

function longOrShort(){
    return new Promise((resolve, reject) => {
        logger.log('\nBuy or Sell: \n1) Long\n2) Short\n3) Back\n4) Quit');
        prompt.get(['longOrShort'], (err, res) => {
            if (!err && res.longOrShort) {
                switch (parseInt(res.longOrShort)){
                    case 1:
                        return resolve('buy');
                        break;
                    case 2:
                        return resolve('sell');
                        break;
                    case 3:
                        reject('Choose Again...');
                        break;
                    case 4:
                        process.exit();
                        break;
                    default:
                        reject('Invalid choice');
                }
            }
        });
    });
}

function confirm(){
    return new Promise((resolve, reject) => {
        logger.log('\nAre you sure? \n1) Yes\n2) No\n3) Back\n4) Quit');
        prompt.get(['sure'], (err, res) => {
            if (!err && res.sure) {
                switch (parseInt(res.sure)){
                    case 1:
                        return resolve('yes');
                        break;
                    case 2:
                        return resolve('no');
                        break;
                    case 3:
                        reject('Choose Again...');
                        break;
                    case 4:
                        process.exit();
                        break;
                    default:
                        reject('Invalid choice');
                }
            }
        });
    });
}

function choosePair(){
    return new Promise((resolve, reject) => {
        logger.log(`\nPick a coin: \n1) ${SUPPORTED_PAIRS[0]} \n2) ${SUPPORTED_PAIRS[1]}\n3) ${SUPPORTED_PAIRS[2]}\n4) ${SUPPORTED_PAIRS[3]}\n5) ${SUPPORTED_PAIRS[4]}\n6) Back \n7) Quit`);
        prompt.get(['pair'], (err, res) => {
            if (!err && res.pair) {
                switch (parseInt(res.pair)){
                    case 1:
                        return resolve(SUPPORTED_PAIRS[0]);
                        break;
                    case 2:
                        return resolve(SUPPORTED_PAIRS[1]);
                        break;
                    case 3:
                        return resolve(SUPPORTED_PAIRS[2]);
                        break;
                    case 4:
                        return resolve(SUPPORTED_PAIRS[3]);
                        break;
                    case 5:
                        return resolve(SUPPORTED_PAIRS[4]);
                        break;
                    case 6:
                        reject('Choose Again...');
                        break;
                    case 7:
                        process.exit();
                        break;
                    default:
                        reject('Invalid choice');
                }
            }
        });
    });
}

Promise.all([poloniex.init(), bitfinex.init()]).then((messages)=>{
    logger.log(messages[0]);
    logger.log(messages[1]);
    getUserInput();
}).catch(logger.error);