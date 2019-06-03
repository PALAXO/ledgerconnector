const bunyan = require('bunyan');
const LedgerConnector = require('./LedgerConnector.js');
const RippleAPI = require('ripple-lib/dist/npm/index').RippleAPI;

module.exports = class RippleConnector extends LedgerConnector {
    constructor(server) {
        super();
        this._log = bunyan.createLogger({name: "RippleConnectorLog"});
        this._DROP_IN_XRPS = "0.000001";
        this._LEDGER_OFFSET = 5;
        this._source = null;
        this._target = null;

        server = this.testUri(server);

        this._API = new RippleAPI({
            server: server
        });
        this._TRANS_INSTRUCT = {
            maxLedgerVersionOffset: this._LEDGER_OFFSET
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
        if (!RippleConnector.testAccount(source) || !RippleConnector.testAccount(target)) {
            this._log.error("Incorrect input.");
            return new Error("Incorrect input.");
        }

        let hash;
        let balanceOk;
        let preparedPayment;
        let signedPayment;
        let transaction;
        let currentTransConst;

        this._source = source;
        this._target = target;

        // Connection to Rippled server
        try {
            await this._API.connect();
        } catch(err) {
            this._log.error("Connection failure. Connecting to the Rippled server (" + this._API.server + ") failed. Try catch block message: " + err.message.toString());
            return new Error("Connection failure.");
        }
        this._log.debug("Connected to the Rippled server (" + this._API.server + ").");

        // Based on current transaction cost set max transaction fee
        currentTransConst = await this.checkCurrentTransactionCost();

        // Set source and target account of transaction
        balanceOk = await this.checkAccountBalance(currentTransConst);
        if (balanceOk !== true)
            return balanceOk;

        // Creating transaction object
        transaction = this.createTransaction(memos);

        // Prepare payment (transaction)
        try {
            preparedPayment = await this._API.preparePayment(source.address.toString(), transaction, this._TRANS_INSTRUCT);
        } catch(err) {
            this._log.error("Transaction preparation failure. Try catch block message: " + err.message.toString());
            return new Error("Transaction preparation failure.");
        }
        this._log.debug("Transaction prepared.");

        // Sign payment (transaction)
        signedPayment = this._API.sign(preparedPayment.txJSON, source.secret.toString());
        hash = signedPayment.id;
        this._log.debug("Transaction signed.");

        // Submit transaction to blockchain
        try {
            await this._API.submit(signedPayment.signedTransaction);
        } catch(err) {
            this._log.error("Transaction submitting failure. Try catch block message: " + err.message.toString());
            return new Error("Transaction submitting failure.");
        }
        this._log.debug("Transaction submitted.");

        // Disconnect from Rippled server
        try {
            await this._API.disconnect();
            this._log.debug("Disconnected from Rippled server (" + this._API.server + ").");
        } catch(err) {
            this._log.warn("Unsuccessful disconnect from Rippled server. Try catch block message: " + err.message.toString());
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
            await this._API.connect();
        } catch(err) {
            this._log.error("Connection failure. Connecting to the Rippled server (" + this._API.server + ") failed. Try catch block message: " + err.message.toString());
            return new Error("Connection failure.");
        }
        this._log.debug("Connected to the Rippled server (" + this._API.server + ").");

        // Getting server info
        try {
            serverInfo = await this._API.getServerInfo();
        } catch(err) {
            this._log.error("Getting server info failure. Try catch block message: " + err.message.toString());
            return new Error("Getting server info failure.");
        }
        this._log.debug("Getting server info successful.");

        ledgers = serverInfo.completeLedgers.split('-');
        minLedgerVersion = Number(ledgers[0]);
        maxLedgerVersion = Number(ledgers[1]);

        // Getting transaction
        try {
            transaction = await this._API.getTransaction(hash.toString(), {
                minLedgerVersion,
                maxLedgerVersion
            });
        } catch(err) {
            this._log.error("Getting transaction failure. Try catch block message: " + err.message.toString());
            return new Error("Getting transaction failure.");
        }
        this._log.debug("Getting transaction successful.");

        // Disconnecting from Rippled server
        try {
            await this._API.disconnect();
            this._log.debug("Disconnected from Rippled server (" + this._API.server +").");
        } catch(err) {
            this._log.warn("Unsuccessful disconnect from Rippled server (" + this._API.server + "). Try catch block message: " + err.message.toString());
        }

        return transaction;
    }

    /**
     * Getting source account (~ wallet) info.
     * Checking if the account has enough XRP to pay transaction fee.
     * Might switch source and target accounts depending on XRP balance.
     * If accounts has enough XRP return true otherwise error.
     *
     * @returns {boolean} true or {Error}
     */
    async checkAccountBalance(currentTransConst) {
        try {
            let sourceInfo = await this._API.getAccountInfo(this._source.address.toString());

            if (sourceInfo.xrpBalance < currentTransConst) {
                let targetInfo = await this._API.getAccountInfo(this._target.address.toString());

                if (Number(targetInfo.xrpBalance) < Number(currentTransConst)) {
                    this._log.error("Not enough XRP");
                    return new Error("Not enough XRP.")
                } else {
                    let temp = this._source;
                    this._source = this._target;
                    this._target = temp;
                    this._log.info("Source and Target accounts roles switched - Essential source has not enough XRP.");
                }
            }
        } catch(err) {
            this._log.warn("Getting account info failure - There is possibility of not having enough XRP for transaction fee. Try catch block message: " + err.message.toString());
        }

        return true;
    }

    /**
     * Get server info and calculate current transaction fee and set max fee.
     * If server info is not available return default transaction cost
     *
     * @returns current transaction cost or default transaction cost
     */
    async checkCurrentTransactionCost() {
        let currentTransConst = 50 * this._DROP_IN_XRPS;

        try {
            let serverInfo = await this._API.getServerInfo();
            currentTransConst = serverInfo.validatedLedger.baseFeeXRP * serverInfo.loadFactor;
            this._TRANS_INSTRUCT.maxFee = String(currentTransConst);
            this._log.debug("Server info received.");
            this._log.debug("Current transaction cost calculated and maximal transaction fee set (" + currentTransConst + ").");
        } catch(err) {
            this._log.warn("Getting server info failure - Transaction fee will be set automatically. Try-Catch block message: " + err.message.toString());
        }

        return currentTransConst;
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
            this._log.error("Invalid server address. App will not connect to rippled server.");
            return "wss://";
        }

        return uri;
    }

    /**
     * Returns transaction object with memos as a message
     *
     * @param memos - transaction optional data
     * @returns Transaction object
     *
     */
    createTransaction(memos) {
        return {
            "source": {
                "address": this._source.address.toString(),
                "maxAmount": {
                    "value": this._DROP_IN_XRPS,
                    "currency": "XRP",
                }
            },
            "destination": {
                "address": this._target.address.toString(),
                "amount": {
                    "value": this._DROP_IN_XRPS,
                    "currency": "XRP",
                }
            },
            "memos": [{ "data": memos.toString() }]
        };
    }

    /**
     * Test account object with address and secret strings. Check if strings contain allowed chars.
     *
     * @param acc account object with address and secret strings.
     * @returns boolean if account object is suitable
     */
    static testAccount(acc) {
        if(!acc)
            return false;

        if (!acc.address || !acc.secret)
            return false;

        return /^[a-zA-Z0-9]+$/.test(acc.address) || /^[a-zA-Z0-9]+$/.test(acc.secret);
    }
};