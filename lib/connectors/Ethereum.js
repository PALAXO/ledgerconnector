`use strict`;

const _ = require(`lodash`);
const Web3 = require(`web3`);
const EthTx = require(`ethereumjs-tx`);

const CONTRACT_ABI = require(`./resources/contract_abi`);
const DEFAULT_GAS_LIMIT = 2000000;

module.exports = class Ethereum {

    /**
     * Constructor...
     *
     * todo: Should we support plain private keys and/or hd-wallets?
     *
     * @constructor
     * @throws {Error} if node URI is not valid
     * @param {Object} options: Ethereum options:
     *                           - node {string} - see {@link checkUri} for the format
     *                           - contract {string} - 0x prefixed address of the contract
     *                           - account {Object} - optional but writes won't be possible is absent
     *                              - keystore {Object} - v3 keystore object
     *                              - password {string} - password to the keystore object
     *                           - gasLimit {number} - maximum amount of gas burned per tx, optional
     */
    constructor(options) {

        if (!checkUri(options.node)){
            throw Error(`Invalid node address.`);
        }

        this.web3 = new Web3(Web3.givenProvider || options.node);
        this.contract = new this.web3.eth.Contract(CONTRACT_ABI, options.contract);

        if (checkAccount(options.account)) {
            this.account = this.web3.eth.accounts.decrypt(
                options.account.keystore,
                options.account.password
            );
        }

        this.gasLimit = _.isNil(options.gasLimit)
            ? DEFAULT_GAS_LIMIT
            : options.gasLimit;
    }

    /**
     * Calls write function of contract belonging to defined address passing
     * the txData to it. When transaction is completed its hash is returned.
     *
     * Use returned hash to retrieve to retrieve the record using
     * {@link readTransaction} method.
     *
     * Note that this method actually sends a transaction and performs contract
     * function call and so there is a ETH cost associated with it.
     *
     * @param {string} txData: String to be stored
     * @throws {Error} if account was not set or is invalid
     * @returns {Promise<string>} Transaction hash
     */
    async writeTransaction(txData) {

        if (!this.account) {
            throw new Error(`Account not provided, this connector serves for read only purposes.`);
        }

        const rawTx = {
            nonce:      Web3.utils.toHex(await this.web3.eth.getTransactionCount(this.account.address)),
            gasPrice:   Web3.utils.toHex(await this.web3.eth.getGasPrice()),
            gasLimit:   Web3.utils.toHex(this.gasLimit),
            from:       this.account.address,
            to:         this.contract.options.address,
            data:       this.contract.methods.write(txData).encodeABI()
        };

        const privateKey = new Buffer(_.trimStart(this.account.privateKey, `0x`), `hex`);
        const transaction = new EthTx.Transaction(rawTx, { chain: await this.web3.eth.net.getId() });

        transaction.sign(privateKey);

        return (await this.web3.eth.sendSignedTransaction(serialize(transaction)))
            .transactionHash;
    }

    /**
     * Looks up for transaction with passed transaction hash. If transaction
     * is found and event fired by contract at specified address is associated
     * with it then the stored string is returned.
     *
     * Note that this method does not perform any transaction so there is no
     * ETH cost associated with it. The only limiting factor is latency to your
     * Ethereum node.
     *
     * @param {string} txHash: Transaction address
     * @throws {Error} if such transaction does not exist
     * @throws {Error} if transaction is found but did not fire the event
     * @returns {Promise<string>} Written data
     */
    async readTransaction(txHash) {

        const tx = await this.web3.eth.getTransaction(txHash);

        if (_.isNull(tx)){
            throw new Error(`Transaction not found.`);
        }

        const events = await this.contract.getPastEvents(
            `OnWrite`, {
                fromBlock: tx.blockNumber,
                toBlock: tx.blockNumber
            }
        );

        const result = _.find(events, { transactionHash: txHash });

        if (_.isNil(result)){
            throw new Error(`Transaction has no data.`);
        }

        return result.returnValues.data;
    }

};

/**
 * Helper function to check if passed uri makes any sense whatsoever and
 * return the result as a boolean.
 *
 * @param {string} uri: node address to be checked
 * @returns {boolean} true if uri complies to required format
 */
function checkUri(uri) {
    return /^(ws|http|https):\/{2}./i.test(uri);
}

/**
 * Helper function to check if account object is filled with required
 * data and returns boolean as result of the validation. Validity of
 * the data is not examined
 *
 * @param {Object} account: format defined by contract of the constructor
 * @returns {boolean} true if fields are filled
 */
function checkAccount(account) {
    return !(_.isNil(account) || _.isNil(account.keystore) ||  _.isNil(account.password));
}

/**
 * Serializes signed transaction and returns it in hexadecimal format
 * so digestible by web3js' sendSignedTransaction()
 *
 * @param {Object} transaction: transaction object for serialisation
 * @returns {string} serialized transaction as hex string
 */
function serialize(transaction) {
    return `0x${transaction.serialize().toString(`hex`)}`;
}