const expect = require("chai").expect;
const rippleConn = require("../Ledger_Connector/RippleConnector");
const cryptoConn = require("../Ledger_Connector/CryptoConnector");
const ripple = new rippleConn("wss://s.altnet.rippletest.net:51233");
const connNoServer = new rippleConn("-");
const conn = new cryptoConn();

describe("testParam(param)", function () {
	// happyday scenario
	it("should return true", function () {
		let param = {
			address: "address",
			secret: "secret"
		};

		let results = rippleConn.testAccount(param);

		expect(results).to.equal(true);
	});

	it("should return false", function () {
		let param = {
			address: "address"
		};

		let results = rippleConn.testAccount(param);

		expect(results).to.equal(false);
	});

	it("should return false", function () {
		let param = {
			secret: "secret"
		};

		let results = rippleConn.testAccount(param);

		expect(results).to.equal(false);
	});

	it("should return false", function () {
		let results = rippleConn.testAccount();

		expect(results).to.equal(false);
	});
});

describe("writeTransaction(source, target)", function () {
	// happyday scenario
	it("should return transaction hash ~ String of 64 chars", async function () {
		let results = await ripple.writeTransaction({
				address: "rH1NguqGbHCZmqGUYuYZcdW4YnUFLeL1u7",
				secret: "shxeETAszRwWAvpQT583XfRd294ea"
			}, {
				address: "rDqihEZXqhFDapfC8VUvqFTcYQgwjtjkwL",
				secret: "sn5fGPhPt5mc6dSsyPob1t4auKCA1"
			},
			"Chai test data");
		expect(results.length).to.equal(64);
	});

	// argument mismatch
	it("should return error", async function () {
		let results = await ripple.writeTransaction({
				address: "rH1NguqGbHCZmqGUYuYZcdW4YnUFLeL1u7"}, {
				address: "rH1NguqGbHCZmqGUYuYZcdW4YnUFLeL1u7"},
			"Test data2");

		expect(results.message).to.equal("Incorrect input.");
	});

	// no server specified
	it("should return transaction hash ~ String of 64 chars", async function () {
		let results = await connNoServer.writeTransaction({
				address: "rH1NguqGbHCZmqGUYuYZcdW4YnUFLeL1u7",
				secret: "shxeETAszRwWAvpQT583XfRd294ea"
			}, {
				address: "rDqihEZXqhFDapfC8VUvqFTcYQgwjtjkwL",
				secret: "sn5fGPhPt5mc6dSsyPob1t4auKCA1"
			},
			"Chai test data");
		expect(results.message).to.equal("Connection failure.");
	});
});

describe("readTransaction(hash)", function () {
	// happyday scenario
	it("should return transaction with memos 'Bananas are greate source of K'", async function () {
		let results = await ripple.readTransaction("BE7C0EEBD5886F4046F01E0157F1A0F89565A3727E128AF25353C22F090185B0")
		expect(results.specification.memos[0].data).to.equal("Bananas are greate source of K");
	});

	// not existing transaction
	it("should return error - transaction doesn't exist", async function () {
		let results = await ripple.readTransaction("NON111EXISTING111ADDRESS");
		expect(results.message).to.equal("Getting transaction failure.");
	});

	// no server specified
	it("should return transaction with memos 'Bananas are greate source of K'", async function () {
		let results = await connNoServer.readTransaction("BE7C0EEBD5886F4046F01E0157F1A0F89565A3727E128AF25353C22F090185B0")
		expect(results.message).to.equal("Connection failure.");
	});
});

describe("saveData(data)", function () {
	// happyday scenario
	it("should return transaction hash ~ String of 64 chars", async function () {
		let results = await conn.saveData("CryptoConnector data");
		expect(results.length).to.equal(64);
	});
});

describe("saveData(address)", function () {
	// happyday scenario
	it("should return transaction with memos 'Bananas are greate source of K'", async function () {
		let results = await conn.readData("BE7C0EEBD5886F4046F01E0157F1A0F89565A3727E128AF25353C22F090185B0");
		expect(results.specification.memos[0].data).to.equal("Bananas are greate source of K");
	});
});