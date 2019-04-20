"use strict";

module.exports = class CryptoConnector {
    constructor() {
        // this._ = PrivateParts.createKey();
        this.nconf = require('nconf');
        this.nconf.file('./config/def.json');
        let server = null;

        if (this.nconf.file) {
            this.impl = this.nconf.get('App:connectorImplementation');
            this.source = this.nconf.get(this.impl + 'Connection:addresses:source');
            this.target = this.nconf.get(this.impl + 'Connection:addresses:target');
            server = this.nconf.get(this.impl + 'Connection:api:server');
        } else {
            this.impl = "Ledger";
            this.source = null;
            this.target = null;
        }
        let Connector = require('./' + this.impl + 'Connector.js');

        this.conn = new Connector(server);
    }

    /**
     * Call async function for saving data to blockchain.
     *
     * @param data Data to be saved.
     * @returns address of transaction with data or Error
     */
    async saveData(data) {
        return await this.conn.writeTransaction(this.source, this.target, data);
    }

    /**
     * Call async function for reading data from blockchain.
     *
     * @param address Address of transaction with data.
     * @returns transaction with data or Error.
     */
    async readData(address) {
        return await this.conn.readTransaction(address);
    }
};

// let nconf = require('nconf');
// nconf.file('./config/def.json');
// let ripple = require("./RippleConnector");
// let conn = new ripple("wss://s.altnet.rippletest.net:51233");
//
// conn.writeTransaction(nconf.get('RippleConnection:addresses:source'),
//     nconf.get('RippleConnection:addresses:target'), "Data data data").then((hash) => {
//     console.log(hash);
//     process.exit();
// });


// let Connector = require("./CryptoConnector");
// // let id = new ind();
//
// let conn = new Connector();
//
// conn.saveData("Hokus pokus call with 3 sec timeout").then((hash) => {
//     console.log(hash);
//     var waitTill = new Date(new Date().getTime() + 3000);
//     while(waitTill > new Date()){}
//     conn.readData(hash).then((trans) => {
//
//         console.log(trans.specification);
//         process.exit();
//     });
// });
// console.log(this.conn.LEDGER_OFFSET);

// // let hash = "957CA19B9F597F59E07B6CFE3F21D29FDEBA24BE9FAB0D337A238E52E24EB730";
// conn.writeTransaction(source, 'rDqihEZXqhFDapfC8VUvqFTcYQgwjtjkwL', 'my data').then((hash) => {
//     console.log(hash);
//     // conn.readTransaction(hash).then((trans) => {
//     //     console.log(trans);
//     //     process.exit();
//     // });
//     process.exit();
// });
