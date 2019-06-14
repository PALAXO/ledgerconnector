`use strict`;


require(`../bootstrapTests`);
const rewire = require(`rewire`);

describe(`CryptoConnector lib`, function() {
    this.timeout(testTimeout);

    let _cryptoConnector;
    let _mockedRipple;

    beforeEach(() => {
        _cryptoConnector = rewire(`../../lib/CryptoConnector`);

        //Ripple-like
        _mockedRipple = {};
        _cryptoConnector.__set__(`RippleConnector`, class Ripple {
            constructor(server, source, target) {
                _mockedRipple.server = server;
                _mockedRipple.source = source;
                _mockedRipple.target = target;
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
            expect(() => new _cryptoConnector()).to.throw(`Connector not specified`);
        });

        it(`can't create instance with unknown connector`, async () => {
            expect(() => new _cryptoConnector(`unknown`)).to.throw(`Unknown connector`);
        });

        it(`creates instance`, async () => {
            const rippleConnector = new _cryptoConnector(`Ripple`);
            expect(rippleConnector).to.be.instanceOf(_cryptoConnector);
            expect(_mockedRipple.server).to.be.a(`string`);
            expect(_mockedRipple.source).to.be.an(`object`);
            expect(_mockedRipple.target).to.be.an(`object`);
        });
    });

    describe(`saveData()`, () => {
        let _rippleConnector;

        beforeEach(() => {
            _rippleConnector = new _cryptoConnector(`Ripple`);
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
            _rippleConnector = new _cryptoConnector(`Ripple`);
        });

        it(`calls read function`, async () => {
            const myHash = `My string`;
            const result = await _rippleConnector.readData(myHash);

            expect(result).to.be.a(`string`);
            expect(_mockedRipple.read).to.equal(myHash);
        });
    });
});
