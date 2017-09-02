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

let allUsers
let userData = []
let userLookup = {}
let loggedEvents = []
let resources = []

initHub()

/**
 * Initialize an interface with the deployed hub.
 */
async function initHub () {
  if (!web3.isConnected()) throw 'Web3 is not connected!';

  if (argv.hub) {
    staticHub = await StaticHub.at(argv.hub)
    console.log('Hub Initd')
  }

  if (argv.blgToken) {
    blgToken = await BLG.at(argv.blgToken)
    console.log('BLG token Initd')
  }

  // Load data for rapid response to clients
  if (staticHub && blgToken) {
    await loadAllUsers()
    await loadAllUserDataAndBLGBalances()
    console.log('User data loaded.')

    await loadAllResources()
    console.log('Resources loaded.')

    await createContractListeners(staticHub)
    await createContractListeners(blgToken)
    console.log('listeners created')

    loadEvents(staticHub, 0, 'latest')
    loadEvents(blgToken, 0, 'latest')

    console.log('Server ready!')
  }
}

/**
 * Create listeners for all events of a given contract.
 */
async function createContractListeners (contract) {
  let userInfo

  contract.allEvents({ fromBlock: 'latest', toBlock: 'latest' }).watch(async (err, res) => {
    if (err) {
      console.log(err)

    } else if (res['event']) {
      // append to list of caught events
      loggedEvents.push(res)
      const _event = res['event']

      if (_event === 'LogResourceAdded') {
        console.log('Resource Added')

        userInfo = await staticHub.getUserData.call(res.args.user)
        resources.push([res.args.resourceUrl, userInfo[0], 0, res.blockNumber])

      } else if (_event === 'LogUserAdded')  {
        console.log('User Added')

        userInfo = await staticHub.getUserData.call(res.args.user)
        userInfo[3] = 0
        userData.push(userInfo)
        userLookup[res.args.user] = userData.length - 1

      } else if (_event === 'LogTokensMinted')  {
        console.log('Tokens Minted')

        // get the user an update their balance
        const userIndex = userLookup[res.args.to]
        userData[userIndex][3] = Number(userData[userIndex][3]) + 1 // update reputation by 1 as only mint 1 at a time
      }
    }
  })
}

/**
 * Get all user data from the hub, personal info and token balances.
 */
async function getAllUserDataAndBLGBalances () {
  if (userData) {
    return userData

  } else {
    await loadAllUserDataAndBLGBalances()
    return userData
  }
}

/**
 * Get all of the active users with in the hub, EOAs.
 * Load into mem.
 */
async function getAllUsers () {
  if (allUsers) {
    return allUsers

  } else {
    await loadAllUsers()
    return allUsers
  }
}

/**
 * Get all resources within the hub.
 * @return {Array} The string urls.
 */
async function getAllResources () {
  if (resources) {
    return resources

  } else {
    await loadAllResources()
    return resources
  }
}

/**
 * @return {Array} Last 10 logged events.
 */
function getLatestEvents() {
  return loggedEvents.slice(loggedEvents.length - 11, -1)
}

/**
 * Load all user data from the hub into memory.
 * Set the user data array to be utilized through out.
 */
async function loadAllUserDataAndBLGBalances () {
  let user

  for (let i = 0; i < allUsers.length; i++) {
    user = await staticHub.getUserData.call(allUsers[i])
    user.push(await getBLGBalance(allUsers[i]))
    userData.push(user)

    userLookup[allUsers[i]] = userData.length - 1// lookup to update token balance later
  }
}

/**
 * Load all of the active users with in the hub, EOAs.
 * @return {Array} The user EOA addresses.
 */
async function loadAllUsers () {
  allUsers = await staticHub.getAllUsers.call()
}

/**
 * Load all existing resources from the contract into storage.
 */
async function loadAllResources () {
  let userInfo
  const resourceIds = await staticHub.getResourceIds.call()

  for (let i = 0; i < resourceIds.length; i++) {
    resources.push(await staticHub.getResourceById.call(resourceIds[i]))

    // Get the actual user name not their address
    userInfo = await staticHub.getUserData.call(resources[i][1])
    resources[i][1] = userInfo[0]
  }
}

async function loadEvents(contract, from, to) {
  contract.allEvents({ fromBlock: from, toBlock: to }).get((err, events) => {
    loggedEvents = loggedEvents.concat(events)
  })
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


module.exports = {
  getAllResources,
  getAllUserDataAndBLGBalances,
  getLatestEvents,
}
