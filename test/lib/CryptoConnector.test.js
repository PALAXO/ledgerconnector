`use strict`;


require(`../bootstrapTests`);
const rewire = require(`rewire`);

describe(`BlockchainConnector lib`, function() {
    this.timeout(testTimeout);

    let _blockchainConnector;
    let _mockedRipple;

    beforeEach(() => {
        _blockchainConnector = rewire(`../../lib/BlockchainConnector`);

        //Ripple-like
        _mockedRipple = {};
        _blockchainConnector.__set__(`RippleConnector`, class Ripple {
            constructor(options, logger) {
                _mockedRipple.options = options;
                _mockedRipple.logger = logger;
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
            expect(() => new _blockchainConnector()).to.throw(`Connector not specified`);
        });

        it(`can't create instance with unknown connector`, async () => {
            expect(() => new _blockchainConnector(`unknown`)).to.throw(`Unknown connector`);
        });

        it(`creates instance`, async () => {
            const rippleConnector = new _blockchainConnector(`Ripple`, `options`, `logger`);
            expect(rippleConnector).to.be.instanceOf(_blockchainConnector);
            expect(_mockedRipple.options).to.equal(`options`);
            expect(_mockedRipple.logger).to.equal(`logger`);
        });
    });

    describe(`saveData()`, () => {
        let _rippleConnector;

        beforeEach(() => {
            _rippleConnector = new _blockchainConnector(`Ripple`);
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
            _rippleConnector = new _blockchainConnector(`Ripple`);
        });

        it(`calls read function`, async () => {
            const myHash = `My string`;
            const result = await _rippleConnector.readData(myHash);

            expect(result).to.be.a(`string`);
            expect(_mockedRipple.read).to.equal(myHash);
        });
    });
});
