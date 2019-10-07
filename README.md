# LedgerConnector

Node.js library for saving and reading data from ledger networks.


## Installation
   
Use the package manager [npm](https://www.npmjs.com/get-npm): 

```
npm i
```


## Usage

_Available implementations:_ Ripple

Use like: 

```
const rippleConnector = new LedgerConnector('Ripple', options);

const originalString = 'My string';
const hash = await rippleConnector.saveData(originalString);

//wait some time till it gets written to ledger

const acquiredString = await rippleConnector.readData(hash)


originalString === acquiredString
```


#### Options:

##### Ripple: 

```
source
  address {string}
  secret {string}
target
  address {string}
  secret {string}
maxFeeXRP {number} - Maximum fee in XRP, optional
allowAccountSwap {boolean} - Swap accounts by actual XRP balance
```

##### Ethereum: 

```
node {string} - Ethereum node address
contract {string} - 0x prefixed address of smart contract
account {Object} - optional but needed for sending transactions
  keystore {Object} - v3 keystore object
  password {string} - password to keystore
gasLimit {number} - Maximum gas to be used, optional
```
