const argv = require('yargs')
.option('blg', { description: 'BLG contract address to interface with.', demandOption: true, type: 'string' })
.argv
const contract = require('truffle-contract')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
const blgArtifacts = require('../build/contracts/BLG.json')
const BLG = contract(blgArtifacts)
BLG.setProvider(web3.currentProvider)
const blgAccount = web3.eth.accounts[0]
const users = [
  '0x9Cb47a806AC793CE9739dd138Be3b9DEB16C14E4'
]

mint()

async function mint() {
  const blg = await BLG.at(argv.blg)
  let tx

  for (let i = 0; i < users.length; i++) {
    console.log('Minting to: ' + users[i])

    // From localhost metamask account
    tx = await blg.mint(users[i], 1000, { from: web3.eth.accounts[0] , gas: 4e6 })

    console.log(tx.logs[0])
  }
}
