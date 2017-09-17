/*
 Backend interface with Ethereum via the web3 API.
 Instantiate contract references and load all relevant data.
 Listen for all events and store locally for client side access.
 */

// Cmd line args
const argv = require('yargs')
.option('hub', { description: 'Hub contract address to interface with.', demand: true, type: 'string' })
.option('blgToken', { description: 'BLG token contract address.', demand: true, type: 'string' })
.argv

// Init a web3 connection, to locally running node
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))

// Truffle contract library utilized for contract abstraction
const contract = require('truffle-contract')

// Load contract data in order to create reference objects
// Hub
const hubArtifacts = require('../../build/contracts/Hub.json')
const Hub = contract(hubArtifacts)
Hub.setProvider(web3.currentProvider)
let hub

// BLG token
const blgArtifacts = require('../../build/contracts/BLG.json')
const BLG = contract(blgArtifacts)
BLG.setProvider(web3.currentProvider)
let blgToken

// Default account to send txs
const blgAccount = web3.eth.accounts[0]

// Local vars
let allUsers = []
let userData = []
let userLookup = {}
let loggedEvents = []
let resources = []
let likes = {}

initHub()

/**
 * Create the reference objects for the blg token and hub.
 * Load all hub data.
 * Create both blg and hub event listeners.
 */
async function initHub () {
  if (!web3.isConnected()) throw 'Web3 is not connected!';

  // Create contract objects
  if (argv.hub) {
    hub = await Hub.at(argv.hub)
    console.log('Hub created!')
  }

  if (argv.blgToken) {
    blgToken = await BLG.at(argv.blgToken)
    console.log('BLG token created!')
  }

  // Load data for rapid response to client connections
  if (hub && blgToken) {
    await loadAllUsers()
    await loadAllUserDataAndBLGBalances()
    await loadAllResources()
    await createContractListeners(hub)
    await createContractListeners(blgToken)

    // NOTE when on public test or main net do not need to load events from block 0
    // Look to define "birth" block of when the contract was deployed
    // Testing
    loadEvents(hub, 0, 'latest')
    loadEvents(blgToken, 0, 'latest')

    // Kovan example, from block udpated
    // loadEvents(hub, 3500000, 'latest')
    // loadEvents(blgToken, 3500000, 'latest')

    console.log('Server ready!')
  }
}

/**
 * Create listeners for all events of a given contract.
 */
async function createContractListeners(contract) {
  let userInfo

  contract.allEvents({ fromBlock: 'latest', toBlock: 'latest' }).watch(async (err, res) => {
    if (err) {
      console.error(err)

    } else if (res['event']) {
      // append to list of caught events
      loggedEvents.push(res)

      // Ugly logging...
      const _event = res['event']
      console.log('\n*** New Event: ' + _event + ' ***')
      console.log(res)
      console.log('\n')

      // Event specific actions
      if (_event === 'LogResourceAdded') {
        userInfo = await hub.getUserData.call(res.args.user)
        resources.push([res.args.resourceUrl, userInfo[0], 0, res.blockNumber])

      } else if (_event === 'LogResourceRemoved') {
        // Find and remvove resource from array
        for (let i = 0; i < resources.length; i++) {
          if (resources[i][0] === res.args.resourceUrl)
            resources.splice(i, 1)
        }

      } else if (_event === 'LogResourceLiked')  {
        // find which resource matches the url and update its reputation
        for (let i = 0; i < resources.length; i++) {
          if (resources[i][0] == res.args.resourceUrl) {
            resources[i][2] = Number(resources[i][2]) + 1
            break
          }
        }

      } else if (_event === 'LogUserAdded')  {
        userInfo = await hub.getUserData.call(res.args.user)
        userInfo[3] = 0
        userData.push(userInfo)
        userLookup[res.args.user] = userData.length - 1

      } else if (_event === 'LogUserRemoved')  {
        const userIndex = userLookup[res.args.user]
        userData.splice(userIndex, 1)
        delete userLookup[res.args.user]

        // Update all mapped items to new indexes
        for (user in userLookup) {
          if (userLookup[user] > userIndex)
            userLookup[user] -= 1
        }

      } else if (_event === 'LogTokensMinted')  {
        // get the user an update their balance
        const userIndex = userLookup[res.args.to]
        userData[userIndex][3] = Number(userData[userIndex][3]) + 1000 // update reputation by 1 as only mint 1 at a time
      }
    }
  })
}

/**
 * Get all user data from the hub, personal info and token balances.
 * Method utilized by client to retrieve data.
 * @return {Array} All users' data, name, position, location, BLG holdings.
 */
async function getAllUserDataAndBLGBalances() {
  if (userData) {
    return userData

  } else {
    await loadAllUserDataAndBLGBalances()
    return userData
  }
}

/**
 * Get all of the active users with in the hub, EOAs.
 * Method utilized by client to retrieve data.
 * @return {Array} All user addresses.
 */
async function getAllUsers() {
  if (allUsers) {
    return allUsers

  } else {
    await loadAllUsers()
    return allUsers
  }
}

/**
 * Get all resources within the hub.
 * Method utilized by client to retrieve data.
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
 * Utilized by client to load latest event upon connecting.
 * @return {Array} Last 10 logged events, or less.
 */
function getLatestEvents() {
  if (loggedEvents.length >= 11) {
    return loggedEvents.slice(loggedEvents.length - 11, -1)

  } else {
    return loggedEvents
  }
}

/**
 * A resource was liked within the ui.
 * @param  {String} resource The url string that was liked.
 * @param  {String} ip  The ip of the user that liked the resource.
 * @return {Boolean} Success of this transaction.
 */
async function likeResource(resource, ip) {
  // User has already liked this resource
  if (resource in likes && ip in likes[resource] && likes[resource][ip]) {
    return false

  // Test call
  } else if (!(await hub.likeResource.call(resource, { from: blgAccount }))) {
    return false

  } else {
    if (!(resource in likes))
      likes[resource] = {}

    likes[resource][ip] = true

    // send tx
    await hub.likeResource(resource, { from: blgAccount, gas: 4e6 })

    return true
  }
}

/**
 * Load all user data from the hub into memory.
 * Set the user data array to be utilized through out.
 */
async function loadAllUserDataAndBLGBalances () {
  let user

  for (let i = 0; i < allUsers.length; i++) {
    user = await hub.getUserData.call(allUsers[i])
    user.push(await getBLGBalance(allUsers[i]))
    userData.push(user)

    userLookup[allUsers[i]] = userData.length - 1 // lookup to update token balance later
  }
}

/**
 * Load all of the active users with in the hub, EOAs.
 * Some items may be 0x0 signifying the user has been removed
 */
async function loadAllUsers () {
  let hubUsers = await hub.getAllUsers.call()

  for (let i = 0; i < hubUsers.length; i++) {
    // User has not been removed!
    if (hubUsers[i] !== '0x0000000000000000000000000000000000000000') {
      allUsers.push(hubUsers[i])
    }
  }
}

/**
 * Load all existing resources from the contract into storage.
 * Some resources owner may be 0x0 signifying the resource has been removed.
 */
async function loadAllResources () {
  let userInfo
  let resourceInfo
  const resourceIds = await hub.getResourceIds.call()

  for (let i = 0; i < resourceIds.length; i++) {
    resourceInfo = await hub.getResourceById.call(resourceIds[i])

    // Resource has not been removed, check user isn't zero
    if (resourceInfo[1] !== '0x0000000000000000000000000000000000000000') {
      resources.push(resourceInfo)

      // Get the actual user name not their address
      userInfo = await hub.getUserData.call(resources[i][1])
      resources[i][1] = userInfo[0]
    }
  }
}

/**
 * Load all events emitted by the given contract from block and to block
 * @param  {Contract} contract Contract reference object.
 * @param  {Integer} from  The block to start looking for events from.
 * @param  {Integer} to  The block to look for events to, may be 'latest'.
 * @return {[type]}          [description]
 */
async function loadEvents(contract, from, to) {
  contract.allEvents({ fromBlock: from, toBlock: to }).get((err, events) => {
    if (err) console.error(err)

    loggedEvents = loggedEvents.concat(events)
  })
}

module.exports = {
  getAllResources,
  getAllUserDataAndBLGBalances,
  getLatestEvents,
  likeResource
}
