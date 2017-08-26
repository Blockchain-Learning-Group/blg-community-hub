const argv = require('yargs')
.option('hub', { description: 'Hub contract address to interface with.', type: 'string' })
.option('blgToken', { description: 'BLG token contract address.', type: 'string' })
.argv

const contract = require('truffle-contract')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

// Hub
const hubArtifacts = require('../../build/contracts/StaticHub.json')
const StaticHub = contract(hubArtifacts)
StaticHub.setProvider(web3.currentProvider)
let staticHub

// BLG token
const blgArtifacts = require('../../build/contracts/BLG.json')
const BLG = contract(blgArtifacts)
BLG.setProvider(web3.currentProvider)
let blgToken

initHub()

/**
 * Get all user data from the hub, personal info and token balances.
 * @return {Array} The user data objects, name, position, location, etc.
 */
async function getAllUserDataAndBLGBalances () {
  const userEOAs = await getAllUsers()
  let userData = []
  let user

  for (let i = 0; i < userEOAs.length; i++) {
    user = await staticHub.getUserData.call(userEOAs[i])
    user.push(await getBLGBalance(userEOAs[i]))
    userData.push(user)
  }

  return userData
}

/**
 * Get the users with in the hub, EOAs.
 * @return {Array} The user EOA addresses.
 */
async function getAllUsers () {
  return await staticHub.getAllUsers.call()
}

/**
 * Get all resources within the hub.
 * @return {Array} The string urls.
 */
async function getAllResources () {
  let resources = []
  let userData
  const resourceIds = await staticHub.getResourceIds.call()

  for (let i = 0; i < resourceIds.length; i++) {
    resources.push(await staticHub.getResourceById.call(resourceIds[i]))

    // Get the actual user name not their address
    userData = await staticHub.getUserData.call(resources[i][1])
    resources[i][1] = userData[0]
  }

  return resources
}

/**
 * Get the BLG token balance of a user
 * @param  {Address} user User EOA, id that owns tokens.
 * @return {Number}  Balance of BLG tokens.
 */
async function getBLGBalance (user) {
  let balance = 0

  try {
    balance = await blgToken.balanceOf.call(user)
  } catch (error) {
    console.log('User has 0 balance in blg token contract.')
  }

  return balance
}

/**
 * Initialize an interface with the deployed hub.
 */
async function initHub () {
  if (!web3.isConnected()) throw 'Web3 is not connected!';

  if (argv.hub) {
    staticHub = await StaticHub.at(argv.hub)
  }

  if (argv.blgToken) {
    blgToken = await BLG.at(argv.blgToken)
  }
}


module.exports = {
  getAllResources,
  getAllUserDataAndBLGBalances,
}
