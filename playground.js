"use strict";

const poloniex = require('./exchanges/poloniex');
const bitfinex = require('./exchanges/bitfinex');

const prompt = require('prompt');
const logger = require('./utils/logger');
const Promise = require('promise');

const SUPPORTED_PAIRS = ['LTCBTC','ETHBTC','XRPBTC','XMRBTC','DASHBTC'];
const devMode = process.argv.includes('dev');
devMode && logger.log('Development mode: ' + devMode);
prompt.start();

(function getUserInput(){

    function win(message){
        logger.log(message);
        getUserInput();
    }

    function fail(message){
        logger.error(message);
        getUserInput();
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



    logger.log('\nPick an action: \n1) Ticker\n2) Balance\n3) Buy\n4) Sell\n5) Choose again...\n6) Quit');
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
                        exchange.balance().then(win).catch(fail);
                    }).catch(fail);
                    break;
                case 3:
                    chooseExchange().then(exchange => {
                        logger.log('Placing an order');
                        exchange.order('ETHBTC', '0.28688524', '0.07320000', 'buy').then(win).catch(fail);
                    }).catch(fail);
                    break;
                case 4:
                    chooseExchange().then(exchange => {
                        logger.log('Placing an order');
                        exchange.order('ETHBTC', '0.28688524', '0.07320000', 'sell').then(win).catch(fail);
                    }).catch(fail);
                    break;
                case 5:
                    win('Choose Again...');
                    break;
                case 6:
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
})();