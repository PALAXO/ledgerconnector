`use strict`;


const _ = require(`lodash`);
const bunyan = require(`bunyan`);
const RippleAPI = require(`ripple-lib/dist/npm/index`).RippleAPI;

module.exports = class RippleConnector {
    constructor(server) {
        this._log = bunyan.createLogger({name: `RippleConnectorLog`});
        this._DROP_IN_XRPS = 0.000001;
        this._LEDGER_OFFSET = 5;

        if (!checkUri(server)) {
            this._log.error(`Invalid server address.`);
            throw new Error(`Invalid server address.`);
        }

        this._API = new RippleAPI({
            server: server
        });
        this._TRANS_INSTRUCT = {
            maxLedgerVersionOffset: this._LEDGER_OFFSET
        };
    }

    /**
     * Writes transaction into Rippled server with memos data
     *
     * @param       {Object}            source      Source object
     * @param       {Object}            target      Target object
     * @param       {string}            memos       String with data to be saved
     * @returns     {Promise<string>}               Transaction hash
     */
    async writeTransaction(source, target, memos) {
        if (!checkAccount(source) || !checkAccount(target)) {
            this._log.error(`Incorrect input.`);

            throw new Error(`Incorrect input.`);
        }

        try {
            // Connection to Rippled server
            await this._API.connect();
            this._log.debug(`Connected to the Rippled server (${this._API.server}).`);

            // Based on current transaction cost set max transaction fee
            const currentTransConst = await checkCurrentTransactionCost();

            // Set source and target account of transaction
            let balanceOk = await checkAccountBalance(source.address, currentTransConst);
            if (!balanceOk) {
                const tmp = source;
                source = target;
                target = tmp;
                this._log.debug(`Using target account for sending.`);

                balanceOk = await checkAccountBalance(source.address, currentTransConst);
                if (!balanceOk) {
                    this._log.error(`Not enough XRP`);
                    throw new Error(`Insufficient credit`);
                }
            }

            // Creating transaction object
            const transaction = createTransaction(source.address, target.address, memos);

            // Prepare payment (transaction)
            const preparedPayment = await this._API.preparePayment(source.address, transaction, this._TRANS_INSTRUCT);
            this._log.debug(`Transaction prepared.`);

            // Sign payment (transaction)
            const signedPayment = this._API.sign(preparedPayment.txJSON, source.secret);
            this._log.debug(`Transaction signed.`);

            // Submit transaction to ledger
            await this._API.submit(signedPayment.signedTransaction);
            this._log.debug(`Transaction submitted.`);

            // Disconnect from Rippled server
            await this._API.disconnect();
            this._log.debug(`Disconnected from Rippled server (${this._API.server}).`);

            return signedPayment.id;

        } catch (err) {
            this._log.error(`Transaction submitting failure - ${err.message}`);

            throw err;
        }
    }

    /**
     * Reads transaction from rippled server
     *
     * @param       {string}        hash    Transaction address
     * @returns     {Promise<*>}            Transaction object
     */
    async readTransaction(hash) {
        try {
            // Connection to Rippled server
            await this._API.connect();
            this._log.debug(`Connected to the Rippled server (${this._API.server}).`);

            // Getting server info
            const serverInfo = await this._API.getServerInfo();
            this._log.debug(`Getting server info successful.`);

            const ledgers = serverInfo.completeLedgers.split(`-`);
            const minLedgerVersion = Number(ledgers[0]);
            const maxLedgerVersion = Number(ledgers[1]);

            // Getting transaction
            const transaction = await this._API.getTransaction(hash.toString(), {
                minLedgerVersion,
                maxLedgerVersion
            });
            this._log.debug(`Getting transaction successful.`);

            // Disconnecting from Rippled server
            await this._API.disconnect();
            this._log.debug(`Disconnected from Rippled server (${this._API.server}).`);

            return transaction;
        } catch (err) {
            this._log.error(`Transaction read failure - ${err.message}`);

            throw err;
        }
    }
};

//----------------------------------------------------------------------------------------------------------------------
//---------------------------------------- PRIVATE ---------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------

/**
 * Checks if the account has enough XRP to pay transaction fee.
 *
 * @param       {string}    source                  Address
 * @param       {number}    currentTransConst       Cost of transaction
 * @returns     {boolean}                           Is account balance suitable?
 */
async function checkAccountBalance(source, currentTransConst) {
    try {
        const sourceInfo = await this._API.getAccountInfo(source);

        return (sourceInfo.xrpBalance >= currentTransConst);
    } catch(err) {
        this._log.warn(err.message);
        return false;
    }
}

/**
 * Get server info and calculate current transaction fee and set max fee.
 * If server info is not available return default transaction cost
 *
 * @returns     {number}    Current transaction cost
 */
async function checkCurrentTransactionCost() {
    let currentTransConst = 50 * this._DROP_IN_XRPS;

    try {
        const serverInfo = await this._API.getServerInfo();
        currentTransConst = serverInfo.validatedLedger.baseFeeXRP * serverInfo.loadFactor;
        this._TRANS_INSTRUCT.maxFee = String(currentTransConst);
        this._log.debug(`Server info received.`);
        this._log.debug(`Current transaction cost calculated and maximal transaction fee set '${currentTransConst}'.`);
    } catch(err) {
        this._log.warn(`Getting server info failure - transaction fee will be set automatically - ${err.message}`);
    }

    return currentTransConst;
}

/**
 * Returns transaction object with memos as a message
 *
 * @param       {string}    source      Source address
 * @param       {string}    target      Target address
 * @param       {string}    memos       Data to be written
 * @returns     {Object}                Transaction object
 *
 */
function createTransaction(source, target, memos) {
    return {
        source: {
            address: source,
            maxAmount: {
                value: this._DROP_IN_XRPS,
                currency: `XRP`,
            }
        },
        destination: {
            address: target,
            amount: {
                value: this._DROP_IN_XRPS,
                currency: `XRP`,
            }
        },
        memos: [{ data: memos }]
    };
}

/**
 * Checks rippled server address
 *
 * @param       {string}    uri     Rippled server address
 * @returns     {boolean}           Is URI suitable?
 */
function checkUri(uri) {
    return (/^(wss?|wss?\\+unix):\/\//.test(uri));
}

/**
 * Checks account object for address and secret strings
 *
 * @param       {Object}    acc     Object with address and secret strings
 * @returns     {boolean}           Is account object suitable?
 */
function checkAccount(acc) {
    if (_.isNil(acc) || _.isNil(acc.address) || _.isNil(acc.secret)) {
        return false;
    }

    return ((/^[a-zA-Z0-9]+$/.test(acc.address)) || (/^[a-zA-Z0-9]+$/.test(acc.secret)));
}
