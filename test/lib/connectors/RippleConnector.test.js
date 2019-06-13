`use strict`;


const bootstrapTests = require(`../../bootstrapTests`);
const rewire = require(`rewire`);

describe(`Ripple connector`, function() {
    this.timeout(testTimeout);

    let _rippleConnector;

    beforeEach(() => {
        _rippleConnector = rewire(`../../../lib/connectors/Ripple`);
    });

    describe(`Ripple class`, () => {
        let _ripple;

        beforeEach(() => {
            const rippleConfig = bootstrapTests.nconf.get(`connectors:Ripple`);
            _ripple = new _rippleConnector(rippleConfig.server, rippleConfig.source, rippleConfig.target);
        });

        describe(`writeTransaction()`, function () {
            it(`returns transaction hash`, async function () {
                const result = await _ripple.writeTransaction(`Chai test data`);
                expect(result).to.be.a(`string`);
                expect(result.length).to.equal(64);
            });
        });

        describe(`readTransaction(hash)`, function () {
            it(`reads transaction memo'`, async function () {
                //Note - might be deleted in the future
                const result = await _ripple.readTransaction(`5DEE3B1B867FE945DFA1AF8BFFAF7AA8B0531822493A19C2E27A278749CD3C14`);
                expect(result).to.equal(`Is this final form?`);
            });

            it(`can't find non-existing transaction`, async function () {
                const unexisting = `1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF`;
                await expect(_ripple.readTransaction(unexisting)).to.be.eventually.rejectedWith(`Transaction not found`);
            });
        });

        describe(`functionality test`, function () {
            it(`writes and reads data`, async function () {
                const myString = `Proletáři všech zemí, vyližte si prdel! #${Math.random()}`;
                const hash = await _ripple.writeTransaction(myString);
                expect(hash).to.be.a(`string`);

                //wait till it gets written
                await new Promise((resolve) => {
                    setTimeout(resolve, 8000);
                });

                const result = await _ripple.readTransaction(hash);
                expect(result).to.equal(myString);
            });
        });
    });

    describe(`createTransactionObject()`, function () {
        let _createTransactionObject;

        beforeEach(() => {
            _createTransactionObject = _rippleConnector.__get__(`createTransactionObject`);
        });

        it(`creates transaction object`, function () {
            const result = _createTransactionObject(`zdroj`, `cil`, `tajemstvi`);
            expect(result.source.address).to.equal(`zdroj`);
            expect(result.destination.address).to.equal(`cil`);
            expect(result.memos[0].data).to.equal(`tajemstvi`);
        });
    });

    describe(`checkUri()`, function () {
        let _checkUri;

        beforeEach(() => {
            _checkUri = _rippleConnector.__get__(`checkUri`);
        });

        it(`checks correct URI`, function () {
            const result = _checkUri(`wss://muj.rippled.server`);
            expect(result).to.be.true;
        });

        it(`checks incorrect URI`, function () {
            const result = _checkUri(`muj.rippled.server`);
            expect(result).to.be.false;
        });

        it(`checks no input`, function () {
            const result = _checkUri();
            expect(result).to.be.false;
        });
    });

    describe(`checkAccount()`, function () {
        let _checkAccount;

        beforeEach(() => {
            _checkAccount = _rippleConnector.__get__(`checkAccount`);
        });

        it(`checks correct account`, function () {
            const param = {
                address: `address`,
                secret: `secret`
            };

            const result = _checkAccount(param);
            expect(result).to.be.true;
        });

        it(`checks incorrect account`, function () {
            const param = {
                address: `velkÝ`,
                secret: `ŠpatnÝ`
            };

            const result = _checkAccount(param);
            expect(result).to.be.false;
        });

        it(`checks account without secret`, function () {
            const param = {
                address: `address`
            };

            const result = _checkAccount(param);
            expect(result).to.be.false;
        });

        it(`checks account without address`, function () {
            const param = {
                secret: `secret`
            };

            const result = _checkAccount(param);
            expect(result).to.be.false;
        });

        it(`checks empty account`, function () {
            const result = _checkAccount({});
            expect(result).to.be.false;
        });

        it(`checks no input`, function () {
            const result = _checkAccount();
            expect(result).to.be.false;
        });
    });
});