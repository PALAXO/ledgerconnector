'use strict';
const RippleAPI = require('ripple-lib').RippleAPI;
const assert = require('assert');

const myAddress = 'rpkYJTuaTYHTTv5FGpYU4SCf6vxq3mbALB';
const mySecret = 'shFcFNkkXjqWZr7LjQy4S6Ugs5J4F';
const nextAddress = 'rE4wtbSSoXfUABESzF8z6qdsGvgNYUeogs';
const nextSecret = 'sh8xmPSLXF7CDjXpZQx7xz3aYQcg4';



// transaction sends 1 XRP from myAddress to nextAddress
const paymentTrans = {
//    "transactionType": "Payment",
    "source": {
        "address": realMyAdd,//myAddress,
        "maxAmount": {
            "value": "1",
            "currency": "XRP",
            //"counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"
        }
    },
    "destination": {
        "address": realNextAdd,//nextAddress,
        "amount": {
            "value": "1",
            "currency": "XRP",
//          "counterparty": "rMH4UxPrbuMa1spCBR98hLLyNJp4d8p4tM"
        }
    },
    "memos": [{ "data": "custom text" } ],
    //"memos": [ {
    //        "Memo": {
    //            "memoData": "72656e74",
    //            "memoType": "687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963",
    //            "memoFormat": "746578742F68746D6C"
    //        }
    //    }
    //],
}
//    "account": myAddress,           //"rMmTCjGFRWPz8S2zAUUoNVSQHxtRQD4eCx",
//    "destination": nextAddress,     //"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV",
//    "memos": [ {
//            "memo": {
//                "memoType": "687474703a2f2f6578616d706c652e636f6d2f6d656d6f2f67656e65726963",
//                "memoData": "72656e74"
//            }
//        }
//    ],
//    "amount": {
//        "currency": "XRP",
//        "value": "1"
//    }
//}

/* Milliseconds to wait between checks for a new ledger. */
const INTERVAL = 1000;
/* Instantiate RippleAPI. Uses s2 (full history server) */
//const api = new RippleAPI({server: 'wss://s2.ripple.com'});
//const api = new RippleAPI({server: 'wss://s.altnet.rippletest.net:51233'});
/* Number of ledgers to check for valid transaction before failing */
const ledgerOffset = 5;
const myInstructions = {
    //maxFee =
    maxLedgerVersionOffset: ledgerOffset
};
var transactionHash;

const api = new RippleAPI({
  //server: 'wss://s.altnet.rippletest.net:51233' // Test rippled server
  server: 'wss://s1.ripple.com'
});

/* Sign document */
function signDocument(privateKey, publicKey, document) {

}

/* Share document with person*/
function shareDocument(privateKey, publicKey, document, person) {

}

/* Claim document as an author's work*/
function claimDocument(privateKey, publicKey, document) {

}

/* Verify a transaction is in a validated XRP Ledger version */
function verifyTransaction(hash, options) {
    console.log('Verifying Transaction');
    return api.getTransaction(hash, options).then(data => {
        console.log('Final Result: ', data.outcome.result);
        console.log('Validated in Ledger: ', data.outcome.ledgerVersion);
        console.log('Sequence: ', data.sequence);
        return data.outcome.result === 'tesSUCCESS';
    }).catch(error => {
        /* If transaction not in latest validated ledger,
            try again until max ledger hit */
        if (error instanceof api.errors.PendingLedgerVersionError) {
            return new Promise((resolve, reject) => {
                setTimeout(() => verifyTransaction(hash, options)
                .then(resolve, reject), INTERVAL);
            });
        }
        return error;
    });
}

/* Function to prepare, sign, and submit a transaction to the XRP Ledger */
function executeTransaction(lastClosedLedgerVersion, prepared, secret) {
    const signedData = api.sign(prepared.txJSON, secret);
    transactionHash = signedData.id;
    return api.submit(signedData.signedTransaction).then(data => {
        console.log('Tentative result: ', data.resultCode);
        console.log('Tentative message: ', data.resultMessage);
        /* If transaction was not successfully submitted throw error */
        assert.strictEqual(data.resultCode, 'tesSUCCESS');
        /* 'tesSUCCESS' means the transaction is being considered for the next ledger, and requires validation. */

        /* If successfully submitted, begin validation workflow */
        const options = {
            minLedgerVersion: lastClosedLedgerVersion,
            maxLedgerVersion: prepared.instructions.maxLedgerVersion
        };
        return new Promise((resolve, reject) => {
            setTimeout(() => verifyTransaction(signedData.id, options)
        .then(resolve, reject), INTERVAL);
        });
    });
}

// connecting -> getting account info
api.connect().then(() => {
    console.log('Connected');


//    console.log('Getting account info for', myAddress);
//    return api.getAccountInfo(myAddress);
//// got account info -> getting another account info
//}).then(info => {
//    console.log(info);
//    console.log('getAccountInfo done');
//    console.log('Getting account info for', nextAddress);
//    return api.getAccountInfo(nextAddress);
//// got another account info
//}).then(info => {
//    console.log(info);
//    console.log('getAccountInfo done');


//}).then() =>
//    return api.prepareOrder(myAddress, paymentTrans, myInstructions);
//    return api.preparePayment(myAddress, paymentTrans, myInstructions);
	return api.preparePayment(realMyAdd, paymentTrans, myInstructions);
}).then(prepared => {
    console.log('Order prepared');
    return api.getLedger().then(ledger => {
        console.log('Current ledger', ledger.ledgerVersion);
        //return executeTransaction(ledger.ledgerVersion, prepared, mySecret);
        return executeTransaction(ledger.ledgerVersion, prepared, realMySec);
    });
}).then(() => {
    console.log('Transaction completed');



//    console.log('Getting account info for', myAddress);
//    return api.getAccountInfo(myAddress);
//// got account info -> getting another account info
//}).then(info => {
//    console.log(info);
//    console.log('getAccountInfo done');
//    console.log('Getting account info for', nextAddress);
//    return api.getAccountInfo(nextAddressAddress);
//// got another account info
//}).then(info => {
//    console.log(info);
//    console.log('getAccountInfo done');


//}).then(() => {
    api.disconnect().then(() => {
        console.log('api disconnected');
        process.exit();
    });
}).catch(console.error);

