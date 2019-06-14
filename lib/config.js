`use strict`;


const nconf = require(`nconf`);

nconf.env();
nconf.argv();

nconf.file(`conf`, {file: `${__dirname}/../config/config.json`});

module.exports = nconf;