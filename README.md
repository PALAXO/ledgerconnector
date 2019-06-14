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

const originalString = 'My string';
const hash = await rippleConnector.saveData(originalString);

const acquiredString = await rippleConnector.readData(hash)

originalString === acquiredString
```

_Available implementations:_ Ripple