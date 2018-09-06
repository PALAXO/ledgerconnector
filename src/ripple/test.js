'use strict';
const RippleAPI = require('ripple-lib').RippleAPI;
const mySecret = 'shFcFNkkXjqWZr7LjQy4S6Ugs5J4F';
const myAddress = 'rpkYJTuaTYHTTv5FGpYU4SCf6vxq3mbALB';

const realAddress = 'rwSDFhSoqba3zCZGigrPYNeyWQj38r6E58';

const options = { "binary" : true, "earliestFirst" : true , "maxLedgerVersion" : "NULL"};

const api = new RippleAPI({
  server: 'wss://s1.ripple.com' // Public rippled server
//    server: 'wss://s.altnet.rippletest.net:51233'
});
api.connect().then(() => {
  /* begin custom code ------------------------------------ */
//  const myAddress = 'rwSDFhSoqba3zCZGigrPYNeyWQj38r6E58';

  console.log('getting account info for', realAddress);
//  return api.getAccountInfo(realAddress);
  return api.getServerInfo();
}).then(info => {
	const ledgers = info.completeLedgers.split('-');
	const minLedgerVersion = Number(ledgers[0]);
	const maxLedgerVersion = Number(ledgers[1]);
//    console.log(info);
//    console.log('getAccountInfo done');
//    console.log('getting account last order memos for', myAddress);
    console.log('getting all transastions');
//    return api.getAccountObjects(realAddress);
//    return api.getAccountOrders(myAddress);
//    return api.getLedger().then(ledger => {
//      console.log(options.maxLedgerVersion);
//      options.maxLedgerVersion = ledger.ledgerVersion;
//      console.log(options.maxLedgerVersion);
//      return api.getTransactions(myAddress, options);
//    });
//  return api.getTransaction(info.previousAffectingTransactionID);		// LAST TRANSACTION
    return api.getTransactions(realAddress, {
    	minLedgerVersion,
    	maxLedgerVersion
    });
}).then(transastion => {
    console.log(transastion);
    //console.log('Data:', transastion.specification.memos[0].data);	// ONE TRANSACTION [0] MEMOS
    console.log('getAccountTransactionHistory done');
  /* end custom code -------------------------------------- */
}).then(() => {
  return api.disconnect();
}).then(() => {
  console.log('done and disconnected.');
}).catch(console.error);
