const argv = require('yargs')
.option('hub', { description: 'Hub contract address to interface with.', type: 'string' })
.argv
const contract = require('truffle-contract')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
console.log('Web3 is connected? ' + web3.isConnected())

const hubArtifacts = require('../../build/contracts/StaticHub.json')
const StaticHub = contract(hubArtifacts)
StaticHub.setProvider(web3.currentProvider)
let staticHub

initHub()

/**
 * Initialize an interface with the deployed hub.
 */
async function initHub () {
  if (argv.hub) {
    staticHub = await StaticHub.at(argv.hub)
  }
}

/**
 * Get all user data from the hub.
 * @return {Array} The user data objects, name, position, location, etc.
 */
async function getUsers () {
  const userEOAs = await staticHub.getUsers.call()
  let userData = []

  for (let i = 0; i < userEOAs.length; i++) {
    userData.push(await staticHub.getUserData.call(userEOAs[i]))
  }

  return userData
}

module.exports = {
  getUsers
}
