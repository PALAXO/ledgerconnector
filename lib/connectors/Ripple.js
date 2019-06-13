`use strict`;


const _ = require(`lodash`);
const bunyan = require(`bunyan`);
const RippleAPI = require(`ripple-lib`).RippleAPI;

const DROP_IN_XRPS = 0.000001;
const LEDGER_OFFSET = 5;
const DEFAULT_TRANSACTION_COST = 50 * DROP_IN_XRPS;
const logger = bunyan.createLogger({name: `RippleLogger`});

module.exports = class Ripple {

    /**
     * Creates new Ripple connector
     * NOTE: source and target are interchangeable
     *
     * @param   {string}    server      Server address
     * @param   {Object}    source      Source object
     * @param   {Object}    target      Target object
     */
    constructor(server, source, target) {
        if (!checkAccount(source) || !checkAccount(target)) {
            logger.error(`Incorrect input.`);
            throw new Error(`Incorrect input.`);
        }
        this.source = source;
        this.target = target;

        if (!checkUri(server)) {
            logger.error(`Invalid server address.`);
            throw new Error(`Invalid server address.`);
        }
        this.api = new RippleAPI({
            server: server
        });
    }

    /**
     * Writes transaction into Rippled server with memos data
     *
     * @param       {string}            memos       String with data to be saved
     * @returns     {Promise<string>}               Transaction hash
     */
    async writeTransaction(memos) {
        try {
            await this.api.connect();
            logger.debug(`Connected to the Rippled server (${this.api.server}).`);

            // Based on current transaction cost set max transaction fee
            const serverInfo = await this.api.getServerInfo();
            let currentTransConst = serverInfo.validatedLedger.baseFeeXRP * serverInfo.loadFactor;
            if (!_.isFinite(currentTransConst)) {
                currentTransConst = DEFAULT_TRANSACTION_COST;
            }
            logger.info(`Current transaction cost calculated and maximal transaction fee set to '${currentTransConst}'.`);

            // Set source and target account of transaction
            let accountInfo = await this.api.getAccountInfo(this.source.address);
            if (accountInfo.xrpBalance < currentTransConst) {
                //Insufficient credit - swap accounts
                const tmp = this.source;
                this.source = this.target;
                this.target = tmp;
                logger.info(`Swapped Ripple accounts`);

                accountInfo = await this.api.getAccountInfo(this.source.address);
                if (accountInfo.xrpBalance < currentTransConst) {
                    logger.error(`Not enough XRP`);
                    throw new Error(`Insufficient credit`);
                }
            }

            const transaction = createTransactionObject(this.source.address, this.target.address, memos);
            const transactionInstruction = {
                maxLedgerVersionOffset: LEDGER_OFFSET,
                maxFee: String(currentTransConst)   //TODO deprecated
            };
            const preparedPayment = await this.api.preparePayment(this.source.address, transaction, transactionInstruction);
            logger.debug(`Transaction prepared.`);

            const signedPayment = this.api.sign(preparedPayment.txJSON, this.source.secret);
            logger.debug(`Transaction signed.`);

            await this.api.submit(signedPayment.signedTransaction);
            logger.info(`Ripple transaction submitted.`);

            await this.api.disconnect();
            logger.debug(`Disconnected from Rippled server (${this.api.server}).`);

            return signedPayment.id;
        } catch (err) {
            logger.error(`Transaction submitting failure - ${err.message}`);

            throw err;
        }
    }

    /**
     * Reads transaction from rippled server
     *
     * @param       {string}            hash    Transaction address
     * @returns     {Promise<string>}           Written string
     */
    async readTransaction(hash) {
        try {
            await this.api.connect();
            logger.debug(`Connected to the Rippled server (${this.api.server}).`);

            const serverInfo = await this.api.getServerInfo();
            const completeLedgers = serverInfo.completeLedgers.split(`-`);
            logger.debug(`Ledger info received.`);

            const transactionOptions = {
                minLedgerVersion: Number(completeLedgers[0]),
                maxLedgerVersion: Number(completeLedgers[1])
            };
            const transaction = await this.api.getTransaction(hash, transactionOptions);
            logger.info(`Ripple transaction acquired.`);

            await this.api.disconnect();
            logger.debug(`Disconnected from Rippled server (${this.api.server}).`);

            return _.get(transaction, `specification.memos[0].data`, ``);
        } catch (err) {
            logger.error(`Transaction read failure - ${err.message}`);

            throw err;
        }
    }
};

//----------------------------------------------------------------------------------------------------------------------
//---------------------------------------- PRIVATE ---------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------------------------

/**
 * Returns transaction object with memos as a message
 *
 * @param       {string}    sourceAddress       Source address
 * @param       {string}    targetAddress       Target address
 * @param       {string}    memos               Data to be written
 * @returns     {Object}                        Transaction object
 *
 */
function createTransactionObject(sourceAddress, targetAddress, memos) {
    return {
        source: {
            address: sourceAddress,
            maxAmount: {
                value: String(DROP_IN_XRPS),
                currency: `XRP`,
            }
        },
        destination: {
            address: targetAddress,
            amount: {
                value: String(DROP_IN_XRPS),
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
