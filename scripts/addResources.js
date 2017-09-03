const argv = require('yargs')
.option('hub', { description: 'Hub contract address to interface with.', demandOption: true, type: 'string' })
.argv
const contract = require('truffle-contract')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
const hubArtifacts = require('../build/contracts/StaticHub.json')
const StaticHub = contract(hubArtifacts)
StaticHub.setProvider(web3.currentProvider)
const blgAccount = web3.eth.accounts[0]
const resources = [
  // 'https://blockchainlearninggroup.com',
  'https://etherscan.io',
  // 'https://etherscan2.io',
  // 'https://etherscan3.io',
  // 'https://etherscan4.io',
  // 'https://etherscan5.io',
  // 'https://etherscan6.io',
  // 'https://etherscan7.io',
  // 'https://etherscan8.io',
  // 'https://etherscan9.io',
]

addResources()

async function addResources() {
  const staticHub = await StaticHub.at(argv.hub)
  let tx

  for (let i = 0; i < resources.length; i++) {
    console.log('Adding resource: ' + resources[i])

    tx = await staticHub.addResource(resources[i], { from: web3.eth.accounts[1], gas: 4e6 })

    console.log(tx.logs[0])
  }
}
