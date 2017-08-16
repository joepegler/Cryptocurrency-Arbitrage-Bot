"use strict";

const TelegramBot = require('node-telegram-bot-api');
const TELELGRAM_KEY = '380504145:AAF16WbEqFSaKtP6ZidJE6mxUD9QmU3tePc';
const CHAT_ID = '-237675778';
const devMode = process.argv.includes('dev');
const logger = require('./logger');

module.exports = (() => {
    const bot = new TelegramBot(TELELGRAM_KEY);
    return {
        broadcast: (message) => {
            if(message){
                message = typeof message === 'object' ? JSON.stringify(message) : message;
                if(!devMode) {
                    bot.sendMessage(CHAT_ID, message);
                }
                else{
                    logger.log(message);
                }
            }
        }
    };
})();