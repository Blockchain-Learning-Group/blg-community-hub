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

console.log(argv.hub)

// User addresses to add to the hub
const users = [
  '0x9cb47a806ac793ce9739dd138be3b9deb16c14e4',
  '0x6f087f1fcca13351873eb815ced3285952fbf89a'
]

removeUsers()

async function removeUsers() {
  const hub = await Hub.at(argv.hub)
  let tx

  for (let i = 0; i < users.length; i++) {
    console.log('Removing user: ' + users[i])

    // Get their index within the user array
    const hubUsers = await hub.getAllUsers()

    for (let j = 0; j < hubUsers.length; j++) {
      if (hubUsers[j] === users[i]) {
        tx = await hub.removeUser(
          users[i],
          j,
          { from: blgAccount, gas: 4e6 }
        )

        console.log(tx.logs[0])

        break
      }
    }
  }
}
