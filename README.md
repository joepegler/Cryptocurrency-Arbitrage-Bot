# How it works  

Cryptocurrency Arbitrage Bot is a node.js trading system that does automatic long/short arbitrage between the two biggest Bitcoin exchanges: [Poloniex](https://poloniex.com/) and [Bitfinex](https://www.bitfinex.com/). The purpose of this bot is to automatically profit from these temporary price differences whilst remaining market-neutral. 

Here is a real example where an arbitrage opportunity exists between Poloniex (long) and Bitfinex (short):

## Spread Example

![image](http://imgur.com/t9Pnjz1)
At the first vertical line, the spread between the exchanges is high so the bot buys Poloniex and short sells Bitfinex. Then, when the spread closes (second vertical line), the bot exits the market by selling Poloniex and buying Bitfinex back.

## Advantages

Unlike other Bitcoin arbitrage systems, this bot doesn't sell but actually short sells Bitcoin on the short exchange. This feature offers two important advantages:

The strategy is market-neutral: the Bitcoin market's moves (up or down) don't impact the strategy returns. This removes a huge risk from the strategy. The Bitcoin market could suddenly lose twice its value that this won't make any difference in the strategy returns.

The strategy doesn't need to transfer funds (USD or BTC) between Bitcoin exchanges. The buy/sell and sell/buy trading activities are done in parallel on two different exchanges, independently. This means that there is no need to deal with transfer latency issues.


### Installation

This bot requires [Node.js](https://nodejs.org/) v4+ to run.

Install the dependencies and devDependencies and start the server.

```sh
$ npm install -d
```

To test the bot and investigate it's features:
```sh
$ node playground
```

To start the bot and begin listening for opportunities:
```sh
$ node app
```