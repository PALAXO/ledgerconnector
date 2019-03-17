"use strict";

var nconf = require('nconf');
nconf.file('./config/def.json');

if (nconf.file)

var Connector = require(nconf.get('App:connectorImplementation'));

// console.log(nconf.get('App:connectorImplementation'));
// console.log(nconf.get('RippleConnection:api:server'));
// console.log(nconf.get('RippleConnection:addresses:target:secret'));

let conn = new Connector();

process.exit();

try {
    conn.writeTransaction(nconf.get('RippleConnection:addresses:source'),
        nconf.get('RippleConnection:addresses:target'), "Test nconf n.1").then((hash) => {
            console.log(hash);
//     conn.readTransaction(hash).then((trans) => {
//         console.log(trans);
//         process.exit();
//     });
//     process.exit();
        });
} catch {
    console.log("Chyba...");
}

// let source = {
//     address: 'rH1NguqGbHCZmqGUYuYZcdW4YnUFLeL1u7',
//     secret: 'shxeETAszRwWAvpQT583XfRd294ea'
// };

// // let hash = "957CA19B9F597F59E07B6CFE3F21D29FDEBA24BE9FAB0D337A238E52E24EB730";
// conn.writeTransaction(source, 'rDqihEZXqhFDapfC8VUvqFTcYQgwjtjkwL', 'my data').then((hash) => {
//     console.log(hash);
//     // conn.readTransaction(hash).then((trans) => {
//     //     console.log(trans);
//     //     process.exit();
//     // });
//     process.exit();
// });
