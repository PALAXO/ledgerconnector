# Circularo-blockchain

Node.js library for saving and reading data from blockchain / ledger networks.

## Installation
   
Use the package manager [npm](https://www.npmjs.com/get-npm): 

```
npm i
```


## Usage

Configure connector parameters in `config/config.json`.

Then use like: 

```
const rippleConnector = new CryptoConnector('Ripple');

const myString = 'My string';
const hash = await rippleConnector.saveData(myString);

const originalString = await rippleConnector.readData(hash)

originalString === myString
```

_Available implementations:_ Ripple