# Ledger_Connector

Ledger_Connector is Nodejs library for saving and reading data from blockchain networks.

## Installation
   
Use the package manager [npm](https://www.npmjs.com/get-npm) to install .

```bash
npm install {path/to/dir}
```

`dir` must contain `package.json` inside it.

In a directory with source file using this library create new directory called `config`.
Create [nconf](https://www.npmjs.com/package/nconf) file inside the `config` directory.
Name the file `def.json` and implement following structure in it:

```json
{
  "App": {
    "connectorImplementation": "Cryptocurrency name"
  },
  "RippleConnection": {
    "api": {
      "server": "transaction verifying node web address"
    },
    "addresses": {
      "source": {
        "address": "ledger address",
        "secret": "ledger secret"
      },
      "target": {
        "address": "ledger address",
        "secret": "ledger secret"
      }
    }
  }
} 
```

_Available implementations:_ Ripple

## Usage



```javascript 1.8
let Ledger_Connector = require('Ledger_Connector');
let connector = new Ledger_Connector();

let hash = await saveData(data);
let trasaction_object = await readData(hash);
```