`use strict`;

const _ = require(`lodash`);
const Web3 = require(`web3`);

const DEFAULT_GAS_LIMIT = 2000000;
const CONTRACT_ABI = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                name: `data`,
                type: `string`
            }
        ],
        name: `OnWrite`,
        type: `event`,
        signature: `0xa2250986bbde623d3fc06a852e50fc3ef2a3284c27bbe22e334af804a9179857`
    },
    {
        constant: false,
        inputs: [
            {
                name: `data`,
                type: `string`
            }
        ],
        name: `write`,
        outputs: [],
        payable: false,
        stateMutability: `nonpayable`,
        type: `function`,
        signature: `0xebaac771`
    }
];

module.exports = class Ethereum {

    /**
     * Constructor...
     *
     * @param {Object} options Ethereum options:
     *                           - node {string} - Node URI
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

    async writeTransaction(txData) {

        if (!this.account) {
            throw new Error(`Account not provided, this connector serves for read only purposes.`);
        }

        const writeCallByteCode = this.contract.methods.write(txData).encodeABI();

        const rawTx = {
            from: this.account.address,
            to: this.contract.options.address,
            value: 0,
            gas: this.gasLimit,
            data: writeCallByteCode
        };

        const signedTx = await this.web3.eth.accounts.signTransaction(rawTx, this.account.privateKey);
        const txReceipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);

        return txReceipt.transactionHash;
    }

    /**
     * Looks up tx hash in logs and returns the previously written data.
     *
     * @param       {string}            txHash      Transaction address
     * @returns     {Promise<string>}               Written data
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

function checkUri(uri) {
    return /^(ws|http|https):\/{2}./i.test(uri); // todo: deprecate http
}

function checkAccount(account) {
    return !(_.isNil(account) || _.isNil(account.keystore) ||  _.isNil(account.password));
}
