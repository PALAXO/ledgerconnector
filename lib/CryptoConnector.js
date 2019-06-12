`use strict`;


const nconf = require(`./config`);

module.exports = class CryptoConnector {
    constructor(connector) {
        if (!connector) {
            throw new Error(`Connector not specified`);
        }

        switch (connector) {
            case `Ripple`: {
                const Connector = require(`./RippleConnector`);
                const rippleConfig = nconf.get(`RippleConnection`);

                this._source = rippleConfig.addresses.source;
                this._target = rippleConfig.addresses.target;

                this._conn = new Connector(rippleConfig.api.server);

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
     * @param       {string}        data    Data to be saved
     * @returns     {Promise<*>}            Address of transaction with data
     */
    async saveData(data) {
        return this._conn.writeTransaction(this._source, this._target, data);
    }

    /**
     * Reads data
     *
     * @param       {string}        address     Address of transaction
     * @returns     {Promise<*>}                Transaction with data
     */
    async readData(address) {
        return this._conn.readTransaction(address);
    }
};