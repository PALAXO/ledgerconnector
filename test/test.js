const expect = require("chai").expect;
const rippleConn = require("../lib/RippleConnector");
const cryptoConn = require("../lib/CryptoConnector");
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
	it("should return transaction with memos 'Is this final form?'", async function () {
		let results = await ripple.readTransaction("5DEE3B1B867FE945DFA1AF8BFFAF7AA8B0531822493A19C2E27A278749CD3C14");
		expect(results.specification.memos[0].data).to.equal("Is this final form?");
	});

	// not existing transaction
	it("should return error - transaction doesn't exist", async function () {
		let results = await ripple.readTransaction("NON111EXISTING111ADDRESS");
		expect(results.message).to.equal("Getting transaction failure.");
	});

	// no server specified
	it("should return transaction with memos 'Is this final form?'", async function () {
		let results = await connNoServer.readTransaction("5DEE3B1B867FE945DFA1AF8BFFAF7AA8B0531822493A19C2E27A278749CD3C14");
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

describe("readData(address)", function () {
	// happyday scenario
	it("should return transaction with memos 'Is this final form?'", async function () {
		let results = await conn.readData("5DEE3B1B867FE945DFA1AF8BFFAF7AA8B0531822493A19C2E27A278749CD3C14");
		expect(results.specification.memos[0].data).to.equal("Is this final form?");
	});
});