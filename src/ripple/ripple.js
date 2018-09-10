'use strict';
const RippleAPI = require('ripple-lib').RippleAPI;
const assert = require('assert');

const centralAddress = "rDqihEZXqhFDapfC8VUvqFTcYQgwjtjkwL";
const realCentralAddress = "rPWFMpUXWeSD2QnA7UKXsTewnYpvBgJ66T";

const myAddress = 'rH1NguqGbHCZmqGUYuYZcdW4YnUFLeL1u7';
const mySecret = 'shxeETAszRwWAvpQT583XfRd294ea';
const nextAddress = 'rDqihEZXqhFDapfC8VUvqFTcYQgwjtjkwL';
const nextSecret = 'sn5fGPhPt5mc6dSsyPob1t4auKCA1';

const realMyAdd = 'rwSDFhSoqba3zCZGigrPYNeyWQj38r6E58';
const realMySec = 'snAPpR3UxQVNw9fHFNgdKqaUWfTkW';
const realNextAdd = 'rPWFMpUXWeSD2QnA7UKXsTewnYpvBgJ66T';
const realNextSec = 'ssyYKbbUrX2D8EQXcRsrzZ4GgF7Xn';

const minAmount = "0.000001";

// transaction sends 1 XRP from myAddress to nextAddress
// const paymentTrans = {
//     "source": {
//         "address": myAddress,//realMyAdd,
//         "maxAmount": {
//             "value": minAmount,
//             "currency": "XRP",
//         }
//     },
//     "destination": {
//         "address": nextAddress,//realNextAdd,
//         "amount": {
//             "value": minAmount,
//             "currency": "XRP",
//         }
//     },
//     "memos": [{ "data": "0 XRP" } ],
// }

/* Milliseconds to wait between checks for a new ledger. */
const INTERVAL = 1000;
/* Instantiate RippleAPI. Uses s2 (full history server) */
//const api = new RippleAPI({server: 'wss://s2.ripple.com'});
/* Number of ledgers to check for valid transaction before failing */
const ledgerOffset = 5;
const myInstructions = {
    //maxFee: currTransConst
    maxLedgerVersionOffset: ledgerOffset
};
var transactionHash;
var currTransCost;

const api = new RippleAPI({
  server: 'wss://s.altnet.rippletest.net:51233' // Test rippled server
  //server: 'wss://s2.ripple.com'
});

/* Sign document
 * privateKey - User's secret address
 * publicKey - User's public address
 * document - Document to be signed
 * timeLimit - Save time limit
 * maxFee - maximum signature fee
 */
function signDocument(privateKey, publicKey, document, timeLimit, maxFee) {
    var paymentTrans = {
        "source": {
            "address": publicKey,
            "maxAmount": {
                "value": minAmount,
                "currency": "XRP",
            }
        },
        "destination": {
            "address": centralAddress,
            "amount": {
                "value": minAmount,
                "currency": "XRP",
            }
        },
        "memos": [{ "data": "Document: [" + document + "] signed" } ],
    }

    sendTransaction(publicKey, paymentTrans, function() {
        console.log("---FINISHED---");
    });
}

/* Share document with person
 * privateKey - User's secret address
 * publicKey - User's public address
 * document - Document to be signed
 * person - Identifier of the person with whom is the document shared
 * timeLimit - Save time limit
 * maxFee - Maximum signature fee
 */
function shareDocument(privateKey, publicKey, document, person, timeLimit, maxFee) {
    var paymentTrans = {
        "source": {
            "address": publicKey,
            "maxAmount": {
                "value": minAmount,
                "currency": "XRP",
            }
        },
        "destination": {
            "address": centralAddress,
            "amount": {
                "value": minAmount,
                "currency": "XRP",
            }
        },
        "memos": [{ "data": "Document: [" + document + "] shared with [" + person + "]" } ],
    }
    sendTransaction(publicKey, paymentTrans, function() {
        console.log("---FINISHED---");
    });
}

/* Claim document as an author's work
 * privateKey - User's secret address
 * publicKey - User's public address
 * document - Document to be signed
 * timeLimit - Save time limit
 * maxFee - maximum signature fee
 */
function claimDocument(privateKey, publicKey, document, timeLimit, maxFee) {
    var paymentTrans = {
        "source": {
            "address": publicKey,
            "maxAmount": {
                "value": minAmount,
                "currency": "XRP",
            }
        },
        "destination": {
            "address": centralAddress,
            "amount": {
                "value": minAmount,
                "currency": "XRP",
            }
        },
        "memos": [{ "data": "Document: [" + document + "] claimed" } ],
    }

    sendTransaction(publicKey, paymentTrans, function() {
        console.log("---FINISHED---");
    });
}

/* Return transaction
 * transactionId - Transaction ID
 */
function getTransaction(transactionId) {
    api.connect().then(() => {
        return api.getServerInfo();
    }).then(info => {
        const ledgers = info.completeLedgers.split('-');
        const minLedgerVersion = Number(ledgers[0]);
        const maxLedgerVersion = Number(ledgers[1]);

        return api.getTransaction(transactionId, {
            minLedgerVersion,
            maxLedgerVersion
        });
    }).then(transaction => {
        console.log(transaction);
        console.log(transaction.specification.memos[0].data);

        return api.disconnect();
    }).then(() => {
        console.log('done and disconnected.');
    }).catch(console.error);
}

/* Return transactions related to requested document id
 * documentId - Document identif
 */
function getDocument(documentId) {
    api.connect().then(() => {
        return api.getServerInfo();
    }).then(info => {
        const ledgers = info.completeLedgers.split('-');
        const minLedgerVersion = Number(ledgers[0]);
        const maxLedgerVersion = Number(ledgers[1]);
        const excludeFailures = true;

        return api.getTransactions(centralAddress, {
            excludeFailures,
            minLedgerVersion,
            maxLedgerVersion
        });
    }).then(transactions => {
        console.log(transactions.length);
        transactions.forEach(function (trans, id) {
            console.log(id);
            if (typeof trans.specification.memos[0].data === "undefined") {
                console.log("undefined");
                return;
            }

            var data = trans.specification.memos[0].data;
            if (data.includes(documentId))
                console.log(data + " by " + trans.specification.source.address);
    });

        return api.disconnect();
    }).then(() => {
        console.log('done and disconnected.');
    }).catch(console.error);
}

// function findDocument(transaction, id) {
//     if (transaction[id].specification.memos[0].data.includes(documentId)) {
//         console.log(transaction[id].specification.memos[0].data);
//     };
// }

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

/* Send transaction to the XRP Ledger
 * clientsAddress - Client's public address
 * transaction - Transaction instructions
 */
function sendTransaction(clientsAddress, transaction) {
    api.connect().then(() => {
        console.log('Connected');
        return api.preparePayment(clientsAddress, transaction, myInstructions);
    }).then(prepared => {
        console.log('Order prepared');
        return api.getLedger().then(ledger => {
            console.log('Current ledger', ledger.ledgerVersion);
            return executeTransaction(ledger.ledgerVersion, prepared, mySecret);
            //return executeTransaction(ledger.ledgerVersion, prepared, realMySec);
        });
    }).then(() => {
        console.log('Transaction completed');
        console.log('Transaction hash: ' + transactionHash);
        api.disconnect().then(() => {
            console.log('api disconnected');
            process.exit();
        });
    }).catch(console.error);
}

api.connect().then(() => {
    console.log('Connected');
    return api.getServerInfo();
}).then(info => {
    currTransCost = info.validatedLedger.baseFeeXRP * info.loadFactor;
    myInstructions.maxFee = String(currTransCost);
    console.log("Current minimum transaction fee is " + currTransCost + " XRP\n + minimum transferable amount " + minAmount + " XRP.");
    api.disconnect().then(() => {
        console.log('api disconnected');
    process.exit();
    });
// }).then(() => {
    //signDocument(mySecret, myAddress, "maxFee = " + currTransCost, "none", "none");
    //shareDocument(mySecret, myAddress, "document4", "Shareman", "none", "none")
    //claimDocument(mySecret, myAddress, "document3", "none", "none");
    //getTransaction("7B70C7CB95041C9C6F179358908257AFB54F96E61A81A5DC921BB86288CB09B7");
    //getDocument("document4");
}).catch(console.error);
