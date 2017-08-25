const argv = require('yargs')
.option('hub', { description: 'Hub contract address to interface with.', demandOption: true, type: 'string' })
.argv
const contract = require('truffle-contract')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
console.log('Web3 is connected? ' + web3.isConnected())

const hubArtifacts = require('../build/contracts/StaticHub.json')
const StaticHub = contract(hubArtifacts)
StaticHub.setProvider(web3.currentProvider)

const blgAccount = web3.eth.accounts[0]

// User addresses to add to the hub
const users = [
  {
    EOA: web3.eth.accounts[0],
    userName: 'Adam Lemmon',
    position: 'Engineer',
    location: 'London, UK'
  },
  {
    EOA: web3.eth.accounts[1],
    userName: 'Mur Tawawala',
    position: 'Marketing',
    location: 'Toronto, CA'
  },
  {
    EOA: web3.eth.accounts[2],
    userName: 'Jordan Welsh',
    position: 'Lawyer',
    location: 'Sydney, AU'
  }
]

addUsers()

async function addUsers() {
  const staticHub = await StaticHub.at(argv.hub)
  let tx

  for (let i = 0; i < users.length; i++) {
    console.log('Adding user: ' + users[i].userName)

    tx = await staticHub.addUser(
      users[i].EOA,
      users[i].userName,
      users[i].position,
      users[i].location,
      { from: blgAccount, gas: 4e6 }
    )

    console.log(tx.logs[0])
  }
}
