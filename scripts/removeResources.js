const argv = require('yargs')
.option('hub', { description: 'Hub contract address to interface with.', demandOption: true, type: 'string' })
.argv
const contract = require('truffle-contract')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
const hubArtifacts = require('../build/contracts/Hub.json')
const Hub = contract(hubArtifacts)
Hub.setProvider(web3.currentProvider)
const blgAccount = web3.eth.accounts[0]
const resources = [
  'https://blockchainlearninggroup.com',
]

removeResources()

async function removeResources() {
  const hub = await Hub.at(argv.hub)
  let tx

  for (let i = 0; i < resources.length; i++) {
    console.log('Adding resource: ' + resources[i])

    tx = await hub.removeResource(resources[i], { from: blgAccount, gas: 4e6 })

    console.log(tx.logs[0])
  }
}
