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
            const rippleConfig = bootstrapTests.nconf.get(`test:connectors:Ripple`);
            _ripple = new _rippleConnector(rippleConfig);
        });

        describe(`writeTransaction()`, () => {
            it(`writes transaction`, async () => {
                const result = await _ripple.writeTransaction(`Chai test data`);
                expect(result).to.be.a(`string`);
                expect(result.length).to.equal(64);
            });
        });

        describe(`readTransaction(hash)`, () => {
            //Test server resets on a regular basis -> read function is tested properly along with write in functionality tests

            it(`can't find non-existing transaction`, async () => {
                const unexisting = `1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF`;
                await expect(_ripple.readTransaction(unexisting)).to.be.eventually.rejectedWith(`Transaction not found`);
            });
        });

        describe(`functionality tests`, () => {
            it(`writes and reads data`, async () => {
                const myString = `My normal string... #${Math.random()}`;
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

    describe(`createTransactionObject()`, () => {
        let _createTransactionObject;

        beforeEach(() => {
            _createTransactionObject = _rippleConnector.__get__(`createTransactionObject`);
        });

        it(`creates transaction object`, () => {
            const result = _createTransactionObject(`zdroj`, `cil`, 123, `tajemstvi`);
            expect(result.source.address).to.equal(`zdroj`);
            expect(result.source.maxAmount.value).to.equal(`123`);
            expect(result.destination.address).to.equal(`cil`);
            expect(result.destination.amount.value).to.equal(`123`);
            expect(result.memos[0].data).to.equal(`tajemstvi`);
        });
    });

    describe(`checkUri()`, () => {
        let _checkUri;

        beforeEach(() => {
            _checkUri = _rippleConnector.__get__(`checkUri`);
        });

        it(`checks correct URI`, () => {
            const result = _checkUri(`wss://muj.rippled.server`);
            expect(result).to.be.true;
        });

        it(`checks incorrect URI`, () => {
            const result = _checkUri(`muj.rippled.server`);
            expect(result).to.be.false;
        });

        it(`checks no input`, () => {
            const result = _checkUri();
            expect(result).to.be.false;
        });
    });

    describe(`checkAccount()`, () => {
        let _checkAccount;

        beforeEach(() => {
            _checkAccount = _rippleConnector.__get__(`checkAccount`);
        });

        it(`checks correct account`, () => {
            const param = {
                address: `address`,
                secret: `secret`
            };

            const result = _checkAccount(param);
            expect(result).to.be.true;
        });

        it(`checks incorrect account`, () => {
            const param = {
                address: `velkÝ`,
                secret: `ŠpatnÝ`
            };

            const result = _checkAccount(param);
            expect(result).to.be.false;
        });

        it(`checks account without secret`, () => {
            const param = {
                address: `address`
            };

            const result = _checkAccount(param);
            expect(result).to.be.false;
        });

        it(`checks account without address`, () => {
            const param = {
                secret: `secret`
            };

            const result = _checkAccount(param);
            expect(result).to.be.false;
        });

        it(`checks empty account`, () => {
            const result = _checkAccount({});
            expect(result).to.be.false;
        });

        it(`checks no input`, () => {
            const result = _checkAccount();
            expect(result).to.be.false;
        });
    });
});