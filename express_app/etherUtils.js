const argv = require('yargs')
.option('hub', { description: 'Hub contract address to interface with.', demandOption: true, type: 'string' })
.argv
const contract = require('truffle-contract')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
console.log('Web3 is connected? ' + web3.isConnected())

const hubArtifacts = require('../build/contracts/StaticHub.json')
const Hub = contract(hubArtifacts)
Hub.setProvider(web3.currentProvider)

initHub()

async function initHub() {
  const hub = await Hub.at(argv.hub)
}
