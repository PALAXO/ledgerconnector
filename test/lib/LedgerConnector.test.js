`use strict`;


require(`../bootstrapTests`);
const rewire = require(`rewire`);

describe(`LedgerConnector lib`, function() {
    this.timeout(testTimeout);

    let _ledgerConnector;
    let _mockedRipple;

    beforeEach(() => {
        _ledgerConnector = rewire(`../../lib/LedgerConnector`);

        //Ripple-like
        _mockedRipple = {};
        _ledgerConnector.__set__(`RippleConnector`, class Ripple {
            constructor(options) {
                _mockedRipple.options = options;
            }

            async writeTransaction(data) {
                _mockedRipple.write = data;
                return `abc`;
            }

            async readTransaction(address) {
                _mockedRipple.read = address;
                return `123`;
            }
        });
    });

    describe(`constructor()`, () => {
        it(`can't create instance without specified connector`, async () => {
            expect(() => new _ledgerConnector()).to.throw(`Connector not specified`);
        });

        it(`can't create instance with unknown connector`, async () => {
            expect(() => new _ledgerConnector(`unknown`)).to.throw(`Unknown connector`);
        });

        it(`creates instance`, async () => {
            const rippleConnector = new _ledgerConnector(`Ripple`, `options`);
            expect(rippleConnector).to.be.instanceOf(_ledgerConnector);
            expect(_mockedRipple.options).to.equal(`options`);
        });
    });

    describe(`saveData()`, () => {
        let _rippleConnector;

        beforeEach(() => {
            _rippleConnector = new _ledgerConnector(`Ripple`);
        });

        it(`calls write function`, async () => {
            const myString = `My string`;
            const result = await _rippleConnector.saveData(myString);

            expect(result).to.be.a(`string`);
            expect(_mockedRipple.write).to.equal(myString);
        });
    });

    describe(`readData()`, () => {
        let _rippleConnector;

        beforeEach(() => {
            _rippleConnector = new _ledgerConnector(`Ripple`);
        });

        it(`calls read function`, async () => {
            const myHash = `My string`;
            const result = await _rippleConnector.readData(myHash);

            expect(result).to.be.a(`string`);
            expect(_mockedRipple.read).to.equal(myHash);
        });
    });
});
