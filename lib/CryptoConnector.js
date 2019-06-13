`use strict`;


const _ = require(`lodash`);
const nconf = require(`./config`);

const RippleConnector = require(`./connectors/Ripple`);

module.exports = class CryptoConnector {
    constructor(connector) {
        if (_.isNil(connector)) {
            throw new Error(`Connector not specified`);
        }

        switch (connector) {
            case `Ripple`: {
                const rippleConfig = nconf.get(`connectors:Ripple`);
                const server = rippleConfig.server;
                const source = rippleConfig.source;
                const target = rippleConfig.target;

                this._conn = new RippleConnector(server, source, target);

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
     * @returns     {Promise<String>}           Address of transaction
     */
    async saveData(data) {
        return this._conn.writeTransaction(data);
    }

    /**
     * Reads data
     *
     * @param       {string}            address     Address of transaction
     * @returns     {Promise<String>}               Data of transaction
     */
    async readData(address) {
        return this._conn.readTransaction(address);
    }
};