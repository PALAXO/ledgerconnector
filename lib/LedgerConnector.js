`use strict`;


const _ = require(`lodash`);
const RippleConnector = require(`./connectors/Ripple`);
const EthereumConnector = require(`./connectors/Ethereum`);

module.exports = class LedgerConnector {
    constructor(connector, options) {
        if (_.isNil(connector)) {
            throw new Error(`Connector not specified`);
        }

        switch (connector) {
            case `Ripple`: {
                this.connector = new RippleConnector(options);

                break;
            }

            case `Ethereum`: {
                this.connector = new EthereumConnector(options);

                break;
            }

            default: {
                throw Error(`Unknown connector`);
            }
        }
    }

    /**
     * Saves data
     *
     * @param       {string}            data    Data to be saved
     * @returns     {Promise<string>}           Address of transaction
     */
    async saveData(data) {
        return this.connector.writeTransaction(data);
    }

    /**
     * Reads data
     *
     * @param       {string}            address     Address of transaction
     * @returns     {Promise<string>}               Data of transaction
     */
    async readData(address) {
        return this.connector.readTransaction(address);
    }
};