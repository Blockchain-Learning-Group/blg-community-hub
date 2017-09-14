// const argv = require('yargs')
// .option('blgToken', { description: 'Token contract address to interface with.', demandOption: true, type: 'string' })
// .argv
const contract = require('truffle-contract')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
const blgArifacts = require('../build/contracts/BLG.json')
const BLG = contract(blgArifacts)
BLG.setProvider(web3.currentProvider)
const blgAccount = web3.eth.accounts[0]

// User addresses to add to the hub
const users = [
  '0x9Cb47a806AC793CE9739dd138Be3b9DEB16C14E4'
]

mintTokens()

async function mintTokens() {
  const blg = await BLG.at('0x0074a4a813118a291b205e3b744d41e2aa6580bb')
  let tx

  for (let i = 0; i < users.length; i++) {
    console.log('Minting to user: ' + users[i])

    tx = await blg.mint(
      users[i],
      100,
      { from: blgAccount, gas: 4e6 }
    )

    console.log(tx.logs[0])
  }
}
