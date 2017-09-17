const Hub = artifacts.require('./Hub.sol')
const BLG = artifacts.require('./BLG.sol')
const blgAccount = web3.eth.accounts[0]

// NOTE do not make method async as truffle will not resolve when utilizing .deployed()
module.exports = deployer => {
  // Deploy BLG token contract
  deployer.deploy(BLG, { from: blgAccount, gas: 4e6 })
  .then(() => {
    // Deploy hub and specify the address of the token
    return deployer.deploy(Hub, BLG.address, { from: blgAccount, gas: 4e6 })

  // Finally retrieve the deployed BLG token contract and set the address of the hub
  }).then(() => {
    return BLG.deployed()

  }).then(blg => {
    return blg.setBLGHub(Hub.address, { from: blgAccount, gas: 4e6 })
  })
}
