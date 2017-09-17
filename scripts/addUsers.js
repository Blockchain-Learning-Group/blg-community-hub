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

// User information to add to the hub
const users = [
  {
    // Metamask AJL kovan account
    EOA: '0x9Cb47a806AC793CE9739dd138Be3b9DEB16C14E4',
    userName: 'Adam Lemmon',
    position: 'Engineer',
    location: 'London, UK'
  },
  {
    // Metamask MJL kovan account
    EOA: '0x9d5F6CE9E32523B0BD60f4B2F716C695CBe334F3',
    userName: 'Mike Lemmon',
    position: 'Scrum Master',
    location: 'Burlington, CA'
  },
]

addUsers()

async function addUsers() {
  const hub = await Hub.at(argv.hub)
  let tx

  for (let i = 0; i < users.length; i++) {
    console.log('Adding user: ' + users[i].userName)

    tx = await hub.addUser(
      users[i].EOA,
      users[i].userName,
      users[i].position,
      users[i].location,
      { from: blgAccount, gas: 4e6 }
    )

    console.log(tx.logs[0])

    // Send 1 ether to each user
    console.log(web3.eth.sendTransaction({ from: blgAccount, to: users[i].EOA, value: 1*10**18 }))
  }
}
