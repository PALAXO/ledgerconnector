"use strict";

var nconf = require('nconf');
nconf.file('./config/def.json');
var LedgerConnector = require('./LedgerConnector.js');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "RippleConnectorLog"});

const RippleAPI = require('ripple-lib').RippleAPI;
const DROP_IN_XRPS = "0.000001";
const LEDGER_OFFSET = 5;

const API = new RippleAPI({
    server: nconf.get('RippleConnection:api:server')
});

var TRANS_INSTRUCT = {
    maxLedgerVersionOffset: LEDGER_OFFSET
};

module.exports = class RippleConnector extends LedgerConnector {
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
        if (!testParam(source) || !testParam(target)) {
            log.error("Incorrect input.");
            return new Error("Incorrect input.");
        }

        let hash;
        let serverInfo;
        let sourceInfo;
        let targetInfo;
        let currentTransConst = 50 * DROP_IN_XRPS;

        let preparedPayment;
        let signedPayment;

        let transaction;

        // Connection to Rippled server
        try {
            await API.connect();
        } catch {
            log.error("Connection failure. Connecting to the Rippled server (" + API.server + ") failed.");
            return new Error("Connection failure.", 0);
        }
        //console.log("Connected");
        log.debug("Connected to the Rippled server (" + API.server + ").");

        // Getting server info
        //  -> calculating current transaction fee & setting max fee on this transaction
        try {
            serverInfo = await API.getServerInfo();
            currentTransConst = serverInfo.validatedLedger.baseFeeXRP * serverInfo.loadFactor;
            TRANS_INSTRUCT.maxFee = String(currentTransConst);
            log.debug("Server info received.");
            log.debug("Current transaction cost calculated and maximal transaction fee set (" + currentTransConst + ").")
        } catch {
            log.warn("Getting server info failure - Transaction fee will be set automatically.");
        }

        // Getting source account (~ wallet) info
        //  -> checking if the account has enough XRP to pay transaction fee
        //   -> might switch source and target accounts depending on XRP balance
        try {
            sourceInfo = await API.getAccountInfo(source.address.toString());

            if (sourceInfo.xrpBalance < currentTransConst) {
                targetInfo = await API.getAccountInfo(target.address.toString());


                if (Number(targetInfo.xrpBalance) < Number(currentTransConst)) {
                    log.error("Not enough XRP");
                    return new Error("Not enough XRP.")
                } else {
                    let temp = source;
                    source = target;
                    target = temp;
                    log.debug("Source and Target accounts roles switched - Essential source has not enough XRP.");
                }
            }
        } catch {
            log.warn("Getting account info failure - There is possibility of not having enough XRP for transaction fee.");
        }

        // Creating transaction object
        transaction = {
            "source": {
                "address": source.address.toString(),
                "maxAmount": {
                    "value": minAmount,
                    "currency": "XRP",
                }
            },
            "destination": {
                "address": target.address.toString(),
                "amount": {
                    "value": minAmount,
                    "currency": "XRP",
                }
            },
            "memos": memos.toString()
        };

        // Prepare payment (transaction)
        try {
            preparedPayment = await API.preparePayment(source.address.toString(), transaction, TRANS_INSTRUCT);
        } catch {
            log.error("Transaction preparation failure.");
            return new Error("Transaction preparation failure.", 1);
        }
        log.debug("Transaction prepared.");

        // Sign payment (transaction)
        signedPayment = API.sign(preparedPayment.txJSON, source.secret.toString());
        hash = signedPayment.id;
        log.debug("Transaction signed.");

        // Submit transaction to blockchain
        try {
            await API.submit(signedPayment.signedTransaction);
        } catch {
            log.error("Transaction submitting failure.");
            return new Error("Transaction submitting failure.", 2);
        }
        log.debug("Transaction submitted.");

        // Disconnect from Rippled server
        try {
            await API.disconnect();
            log.debug("Disconnected from Rippled server (" + API.server +").");
        } catch {
            log.warn("Unsuccessful disconnect from Rippled server.");
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
            await API.connect();
        } catch {
            log.error("Connection failure. Connecting to the Rippled server (" + API.server + ") failed.");
            return new Error("Connection failure.", 0);
        }
        log.debug("Connected to the Rippled server (" + API.server + ").");

        // Getting server info
        try {
            serverInfo = await API.getServerInfo();
        } catch {
            log.error("Getting server info failure.");
            return new Error("Getting server info failure.", 3);
        }
        log.debug("Getting server info successful.");

        ledgers = serverInfo.completeLedgers.split('-');
        minLedgerVersion = Number(ledgers[0]);
        maxLedgerVersion = Number(ledgers[1]);

        // Getting transaction
        try {
            transaction = await API.getTransaction(hash.toString(), {
                minLedgerVersion,
                maxLedgerVersion
            });
        } catch {
            log.error("Getting transaction failure.");
            return new Error("Getting transaction failure.", 4);
        }
        log.debug("Getting transaction successful.");

        // Disconnecting from Rippled server
        try {
            await API.disconnect();
            log.debug("Disconnected from Rippled server (" + API.server +").");
        } catch {
            log.warn("Unsuccessful disconnect from Rippled server (" + API.server + ").");
        }

        return transaction;
    }
};

function testParam(param) {
    if (param === null)
        return false;

    if (typeof param.address === "undefined" || typeof param.secret === "undefined")
        return false;

    return true;
}