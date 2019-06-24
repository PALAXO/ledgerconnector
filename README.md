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
```

Note: Accounts are interchangeable, source one is selected automatically
