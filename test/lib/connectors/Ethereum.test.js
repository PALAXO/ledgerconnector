`use strict`;

const bootstrapTests = require(`../../bootstrapTests`);
const rewire = require(`rewire`);

describe(`Ethereum connector`, function() {
    this.timeout(testTimeout);

    let _ethereumConnector;

    beforeEach(() => {
        _ethereumConnector = rewire(`../../../lib/connectors/Ethereum`);
    });

    describe(`Ethereum class`, () => {
        let _ethereum;

        beforeEach(() => {
            const config = bootstrapTests.nconf.get(`test:connectors:Ethereum`);
            _ethereum = new _ethereumConnector(config);
        });

        describe(`writeTransaction()`, () => {
            it(`should write transaction`, async () => {
                const result = await _ethereum.writeTransaction(`Test data`);
                expect(result).to.be.a(`string`);
                expect(result.length).to.equal(66);
                expect(result.substring(0, 2)).to.equal(`0x`);
            });
        });

        describe(`readTransaction()`, async () => {
            it(`should fetch transaction data`, async () => {
                const result = await _ethereum
                    .readTransaction(`0x9ffb237c082ca79f368c4738733f4af755729f3fa7d97b821a9b8e5def623308`);
                expect(result).to.be.a(`string`);
                expect(result).to.equal(`Test data`);
            });

            it(`should fail because of non-existing transaction`, async () => {
                const txHash = `0xfffb237c082ca79f368c4738733f4af755729f3fa7d97b821a9b8e5def623308`;
                await expect(_ethereum.readTransaction(txHash)).to.be.eventually.rejectedWith(`Transaction not found.`);
            });

            it(`should fail because of unassociated transaction`, async () => {
                const txHash = `0xe35dd75fe7962f2652539cef75da6354215cca5856bcb55eb9cb983297fe8062`;
                await expect(_ethereum.readTransaction(txHash)).to.be.eventually.rejectedWith(`Transaction has no data.`);
            });
        });
    });
});