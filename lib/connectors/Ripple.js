`use strict`;


const _ = require(`lodash`);
const bunyan = require(`bunyan`);
const RippleAPI = require(`ripple-lib`).RippleAPI;

const DROP_IN_XRPS = 0.000001;
const DEFAULT_MAX_FEE = 1000 * DROP_IN_XRPS;

module.exports = class Ripple {

    /**
     * Creates new Ripple connector
     *
     * @param   {Object}    options     Ripple options:
     *                                    - server {string} - server URI
     *                                    - source
     *                                      - address {string}
     *                                      - secret {string}
     *                                    - target
     *                                      - address {string}
     *                                      - secret {string}
     *                                    - maxFeeXRP {number} - Maximum fee in XRP, optional
     * @param   {Object}    logger      Logger, optional
     */
    constructor(options, logger) {
        //Logger
        this.logger = logger;
        if (_.isNil(logger)) {
            this.logger = bunyan.createLogger({name: `RippleLogger`});
        }

        //Server URI
        const server = options.server;
        if (!checkUri(server)) {
            throw new Error(`Invalid server address.`);
        }

        //Accounts info
        if (!checkAccount(options.source) || !checkAccount(options.target)) {
            throw new Error(`Incorrect accounts.`);
        }
        this.source = options.source;
        this.target = options.target;

        //Max fee
        let maxFeeXRP = options.maxFeeXRP;
        if (!_.isFinite(maxFeeXRP)) {
            this.logger.info(`Max fee not selected - will use ${DEFAULT_MAX_FEE}`);
            maxFeeXRP = DEFAULT_MAX_FEE;
        }
        this.maxFeeXRP = maxFeeXRP;

        this.api = new RippleAPI({
            server: server,
            maxFeeXRP: String(this.maxFeeXRP)
        });
    }

    /**
     * Writes transaction into Rippled server with memos data
     *
     * @param       {string}            data        String with data to be saved
     * @returns     {Promise<string>}               Transaction hash
     */
    async writeTransaction(data) {
        try {
            await this.api.connect();

            const [serverInfo, sourceInfo, targetInfo] = await Promise.all([
                this.api.getServerInfo(),
                this.api.getAccountInfo(this.source.address),
                this.api.getAccountInfo(this.target.address)
            ]);

            const currentFeeXRP = Number(serverInfo.validatedLedger.baseFeeXRP) * serverInfo.loadFactor;
            if (currentFeeXRP > this.maxFeeXRP) {
                throw new Error(`Maximum allowed fee exceeded, requires ${currentFeeXRP}.`);
            }

            const currentCost = currentFeeXRP + DROP_IN_XRPS;
            if (currentCost > Number(sourceInfo.xrpBalance) && currentCost > Number(targetInfo.xrpBalance)) {
                throw new Error(`Account balance is not sufficient, requires ${currentCost}.`);
            }

            if (Number(targetInfo.xrpBalance) > Number(sourceInfo.xrpBalance)) {
                const tmp = this.source;
                this.source = this.target;
                this.target = tmp;
            }

            const transaction = createTransactionObject(this.source.address, this.target.address, DROP_IN_XRPS, data);
            const preparedPayment = await this.api.preparePayment(this.source.address, transaction);

            const signedPayment = this.api.sign(preparedPayment.txJSON, this.source.secret);
            await this.api.submit(signedPayment.signedTransaction);

            await this.api.disconnect();

            return signedPayment.id;
        } catch (err) {
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

            const serverInfo = await this.api.getServerInfo();

            const completeLedgers = serverInfo.completeLedgers.split(`-`);
            const transactionOptions = {
                minLedgerVersion: Number(completeLedgers[0]),
                maxLedgerVersion: Number(completeLedgers[1])
            };
            const transaction = await this.api.getTransaction(hash, transactionOptions);

            await this.api.disconnect();

            return _.get(transaction, `specification.memos[0].data`, ``);
        } catch (err) {
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
 * @param       {number}    value               Value to be sent
 * @param       {string}    data                Data to be written
 * @returns     {Object}                        Transaction object
 *
 */
function createTransactionObject(sourceAddress, targetAddress, value, data) {
    return {
        source: {
            address: sourceAddress,
            maxAmount: {
                value: String(value),
                currency: `XRP`,
            }
        },
        destination: {
            address: targetAddress,
            amount: {
                value: String(value),
                currency: `XRP`,
            }
        },
        memos: [{ data: data }]
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
