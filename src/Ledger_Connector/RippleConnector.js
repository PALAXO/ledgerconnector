"use strict";
var LedgerConnector = require('./LedgerConnector.js');

module.exports = class RippleConnector extends LedgerConnector {
    constructor(server) {
        super();
        // this._ = PrivateParts.createKey();
        this.bunyan = require('bunyan');
        this.log = this.bunyan.createLogger({name: "RippleConnectorLog"});
        this.RippleAPI = require('ripple-lib').RippleAPI;
        this.DROP_IN_XRPS = "0.000001";
        this.LEDGER_OFFSET = 5;

        server = this.testUri(server);

        this.API = new this.RippleAPI({
            server: server
        });
        this.TRANS_INSTRUCT = {
            maxLedgerVersionOffset: this.LEDGER_OFFSET
        };
    }

    /**
     * Write transaction into Rippled server with memos data.
     * Source and target are objects representing account with 'address' and 'secret' variables.
     *  - 'address' represents string allowing to view public data about account
     *  - 'secret' represents string allowing to create new transactions
     *  Source and target account might be switched.
     *
     * @param source Object with 'address' and 'secret' variables.
     * @param target Object with 'address' and 'secret' variables.
     * @param memos String with data to be saved into Rippled server.
     * @returns Transaction hash or Error
     */
    async writeTransaction(source, target, memos) {
        if (!this.testAccount(source) || !this.testAccount(target)) {
            this.log.error("Incorrect input.");
            return new Error("Incorrect input.", 0);
        }

        let hash;
        let serverInfo;
        let sourceInfo;
        let targetInfo;
        let currentTransConst = 50 * this.DROP_IN_XRPS;

        let preparedPayment;
        let signedPayment;

        let transaction;

        // Connection to Rippled server
        try {
            await this.API.connect();
        } catch(err) {
            this.log.error("Connection failure. Connecting to the Rippled server (" + this.API.server + ") failed. Try catch block message: " + err.message.toString());
            return new Error("Connection failure.", 1);
        }
        //console.log("Connected");
        this.log.debug("Connected to the Rippled server (" + this.API.server + ").");

        // Getting server info
        //  -> calculating current transaction fee & setting max fee on this transaction
        try {
            serverInfo = await this.API.getServerInfo();
            currentTransConst = serverInfo.validatedLedger.baseFeeXRP * serverInfo.loadFactor;
            this.TRANS_INSTRUCT.maxFee = String(currentTransConst);
            this.log.debug("Server info received.");
            this.log.debug("Current transaction cost calculated and maximal transaction fee set (" + currentTransConst + ").")
        } catch(err) {
            this.log.warn("Getting server info failure - Transaction fee will be set automatically. Try-Catch block message: " + err.message.toString());
        }

        // Getting source account (~ wallet) info
        //  -> checking if the account has enough XRP to pay transaction fee
        //   -> might switch source and target accounts depending on XRP balance
        try {
            sourceInfo = await this.API.getAccountInfo(source.address.toString());

            if (sourceInfo.xrpBalance < currentTransConst) {
                targetInfo = await this.API.getAccountInfo(target.address.toString());

                if (Number(targetInfo.xrpBalance) < Number(currentTransConst)) {
                    this.log.error("Not enough XRP");
                    return new Error("Not enough XRP.", 2)
                } else {
                    let temp = source;
                    source = target;
                    target = temp;
                    this.log.debug("Source and Target accounts roles switched - Essential source has not enough XRP.");
                }
            }
        } catch(err) {
            this.log.warn("Getting account info failure - There is possibility of not having enough XRP for transaction fee. Try catch block message: " + err.message.toString());
        }

        // Creating transaction object
        transaction = {
            "source": {
                "address": source.address.toString(),
                "maxAmount": {
                    "value": this.DROP_IN_XRPS,
                    "currency": "XRP",
                }
            },
            "destination": {
                "address": target.address.toString(),
                "amount": {
                    "value": this.DROP_IN_XRPS,
                    "currency": "XRP",
                }
            },
            "memos": [{ "data": memos.toString() }]
        };

        // Prepare payment (transaction)
        try {
            preparedPayment = await this.API.preparePayment(source.address.toString(), transaction, this.TRANS_INSTRUCT);
        } catch(err) {
            this.log.error("Transaction preparation failure. Try catch block message: " + err.message.toString());
            return new Error("Transaction preparation failure.", 3);
        }
        this.log.debug("Transaction prepared.");

        // Sign payment (transaction)
        signedPayment = this.API.sign(preparedPayment.txJSON, source.secret.toString());
        hash = signedPayment.id;
        this.log.debug("Transaction signed.");

        // Submit transaction to blockchain
        try {
            await this.API.submit(signedPayment.signedTransaction);
        } catch(err) {
            this.log.error("Transaction submitting failure. Try catch block message: " + err.message.toString());
            return new Error("Transaction submitting failure.", 4);
        }
        this.log.debug("Transaction submitted.");

        // Disconnect from Rippled server
        try {
            await this.API.disconnect();
            this.log.debug("Disconnected from Rippled server (" + this.API.server + ").");
        } catch(err) {
            this.log.warn("Unsuccessful disconnect from Rippled server. Try catch block message: " + err.message.toString());
        }

        return hash;
    }

    /**
     * Read transaction from rippled server.
     *
     * @param hash String representing transaction address.
     * @returns Transaction object or Error
     */
    async readTransaction(hash) {
        let serverInfo;
        let ledgers;
        let minLedgerVersion;
        let maxLedgerVersion;
        let transaction;

        // Connection to Rippled server
        try {
            await this.API.connect();
        } catch(err) {
            this.log.error("Connection failure. Connecting to the Rippled server (" + this.API.server + ") failed. Try catch block message: " + err.message.toString());
            return new Error("Connection failure.", 5);
        }
        this.log.debug("Connected to the Rippled server (" + this.API.server + ").");

        // Getting server info
        try {
            serverInfo = await this.API.getServerInfo();
        } catch(err) {
            this.log.error("Getting server info failure. Try catch block message: " + err.message.toString());
            return new Error("Getting server info failure.", 6);
        }
        this.log.debug("Getting server info successful.");

        ledgers = serverInfo.completeLedgers.split('-');
        minLedgerVersion = Number(ledgers[0]);
        maxLedgerVersion = Number(ledgers[1]);

        // Getting transaction
        try {
            transaction = await this.API.getTransaction(hash.toString(), {
                minLedgerVersion,
                maxLedgerVersion
            });
        } catch(err) {
            this.log.error("Getting transaction failure. Try catch block message: " + err.message.toString());
            return new Error("Getting transaction failure.", 7);
        }
        this.log.debug("Getting transaction successful.");

        // Disconnecting from Rippled server
        try {
            await this.API.disconnect();
            this.log.debug("Disconnected from Rippled server (" + this.API.server +").");
        } catch(err) {
            this.log.warn("Unsuccessful disconnect from Rippled server (" + this.API.server + "). Try catch block message: " + err.message.toString());
        }

        return transaction;
    }

    /**
     * Test account object with address and secret strings. Check if strings contain allowed chars.
     *
     * @param acc account object with address and secret strings.
     * @returns boolean if account object is suitable
     */
    testAccount(acc) {
        if(!acc)
            return false;

        if (!acc.address || !acc.secret)
            return false;

        return /^[a-zA-Z0-9]+$/.test(acc.address) || /^[a-zA-Z0-9]+$/.test(acc.secret);
    }

    /**
     * Check rippled server address. If it does not suit basic pattern log it and replace with suitable pattern
     * (replacement is NOT CONNECT-ABLE address).
     *
     * @param uri rippled server address.
     * @returns string with server uri
     */
    testUri(uri) {
        if (! /^(wss?|wss?\\+unix):\/\//.test(uri)) {
            this.log.error("Invalid server address. App will not connect to rippled server.");
            return "wss://";
        }

        return uri;
    }
};