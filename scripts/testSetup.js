const argv = require('yargs')
.option('hub', { description: 'Hub contract address to interface with.', demandOption: true, type: 'string' })
.argv
require('./addUsers')
require('./addResources')
