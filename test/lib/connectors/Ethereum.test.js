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
            it(`should send transaction (passes without deployed contract)`, async () => {
                const result = await _ethereum.writeTransaction(`Test data`);
                expect(result).to.be.a(`string`);
                expect(result.length).to.equal(66);
                expect(result.substring(0, 2)).to.equal(`0x`);
            });
        });

        describe(`readTransaction()`, async () => {
            it(`should fetch transaction data`, async () => {
                const result = await _ethereum
                    .readTransaction(`0xda9b5e8eca1529237d12b6c31952cc41d7b7943cef2fa2324681495f32eff7e6`);
                expect(result).to.be.a(`string`);
                expect(result).to.equal(`some unique data`);
            });

            it(`should fail because of non-existing transaction (passes without deployed contract) `, async () => {
                const txHash = `0xfffb237c082ca79f368c4738733f4af755729f3fa7d97b821a9b8e5def623308`;
                await expect(_ethereum.readTransaction(txHash)).to.be.eventually.rejectedWith(`Transaction not found.`);
            });

            it(`should fail because of unassociated transaction`, async () => {
                const txHash = `0x70e82352b281cf3e293aba3ccbcfd9f596e3e973fe3907b2c7ba000025712a13`;
                await expect(_ethereum.readTransaction(txHash)).to.be.eventually.rejectedWith(`Transaction has no data.`);
            });
        });
    });
});