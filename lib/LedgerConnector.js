module.exports = class LedgerConnector {
    /**
     * Write transaction into blockchain database with memos data.
     * Source and target are objects representing account/wallet with 'address' and 'secret' variables.
     *  - 'address' represents string allowing to view public data about account
     *  - 'secret' represents string allowing to create new transactions
     *  Source and target account might be switched.
     *
     * @param source Object with 'address' and 'secret' variables.
     * @param target Object with 'address' and 'secret' variables.
     * @param memos String with data to be saved into blockchain.
     * @returns Transaction hash or Error
     */
    async writeTransaction(source, target, memos) {
        throw new Error("Implement!");
    }

    /**
     * Read transaction from blockchain database.
     *
     * @param hash String representing transaction address on blockchain.
     * @returns Transaction object or Error
     */
    async readTransaction(hash) {
        throw new Error("Implement!");
    }
};