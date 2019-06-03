const conf = require('nconf');
let Connector = require('./LedgerConnector');

module.exports = class CryptoConnector {
    constructor() {
        conf.file('./config/def.json');
        let impl = "Ledger";
        let server = null;

        this._source = null;
        this._target = null;

        if (conf.get('App:connectorImplementation') !== undefined) {
            impl = conf.get('App:connectorImplementation');
            this._source = conf.get(impl + 'Connection:addresses:source');
            this._target = conf.get(impl + 'Connection:addresses:target');
            server = conf.get(impl + 'Connection:api:server');

            Connector = require('./' + impl + 'Connector');
        }

        this._conn = new Connector(server);
    }

    /**
     * Call async function for saving data to blockchain.
     *
     * @param data Data to be saved.
     * @returns address of transaction with data or Error
     */
    async saveData(data) {
        return await this._conn.writeTransaction(this._source, this._target, data);
    }

    /**
     * Call async function for reading data from blockchain.
     *
     * @param address Address of transaction with data.
     * @returns transaction with data or Error.
     */
    async readData(address) {
        return await this._conn.readTransaction(address);
    }
};