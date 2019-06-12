`use strict`;


const expect = require(`chai`).expect;
const cryptoConn = require(`../lib/CryptoConnector`);
const conn = new cryptoConn();

describe(`CryptoConnector lib`, () => {
    describe(`saveData(data)`, function () {
        // happyday scenario
        it(`should return transaction hash ~ String of 64 chars`, async function () {
            const results = await conn.saveData(`CryptoConnector data`);
            expect(results.length).to.equal(64);
        });
    });

    describe(`readData(address)`, function () {
        // happyday scenario
        it(`should return transaction with memos 'Is this final form?'`, async function () {
            const results = await conn.readData(`5DEE3B1B867FE945DFA1AF8BFFAF7AA8B0531822493A19C2E27A278749CD3C14`);
            expect(results.specification.memos[0].data).to.equal(`Is this final form?`);
        });
    });
});
