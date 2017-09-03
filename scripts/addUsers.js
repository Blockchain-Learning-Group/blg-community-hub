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

console.log(argv.hub)

// User addresses to add to the hub
const users = [
  {
    EOA: web3.eth.accounts[0],
    userName: 'Blockchain Learning Group',
    position: 'Education',
    location: 'Toronto, CA & London, UK'
  },
  {
    EOA: web3.eth.accounts[1],
    userName: 'Adam Lemmon',
    position: 'Engineer',
    location: 'London, UK'
  },
  // {
  //   EOA: web3.eth.accounts[2],
  //   userName: 'Mur Tawawala',
  //   position: 'Marketing',
  //   location: 'Toronto, CA'
  // },
  // {
  //   EOA: web3.eth.accounts[3],
  //   userName: 'Jordan Welsh',
  //   position: 'Lawyer',
  //   location: 'Sydney, AU'
  // },
  // {
  //   EOA: web3.eth.accounts[4],
  //   userName: 'Adam Lemmon1',
  //   position: 'Engineer',
  //   location: 'London, UK'
  // },
  // {
  //   EOA: web3.eth.accounts[5],
  //   userName: 'Mur Tawawala1',
  //   position: 'Marketing',
  //   location: 'Toronto, CA'
  // },
  // {
  //   EOA: web3.eth.accounts[6],
  //   userName: 'Jordan Welsh1',
  //   position: 'Lawyer',
  //   location: 'Sydney, AU'
  // },
  // {
  //   EOA: web3.eth.accounts[7],
  //   userName: 'Jordan Welsh2',
  //   position: 'Lawyer',
  //   location: 'Sydney, AU'
  // },
  // {
  //   EOA: web3.eth.accounts[8],
  //   userName: 'Adam Lemmon2',
  //   position: 'Engineer',
  //   location: 'London, UK'
  // },
  // {
  //   EOA: web3.eth.accounts[9],
  //   userName: 'Mur Tawawala2',
  //   position: 'Marketing',
  //   location: 'Toronto, CA'
  // }
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
