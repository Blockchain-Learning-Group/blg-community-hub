const ErrorLib = artifacts.require('./ErrorLib.sol')
const StaticHub = artifacts.require('./StaticHub.sol')
const Hub = artifacts.require('./Hub.sol')
const Relay = artifacts.require('./Relay.sol')
const RelayStorage = artifacts.require('./RelayStorage.sol')
const BLG = artifacts.require('./BLG.sol')
const blgAccount = web3.eth.accounts[0]
let relayStorage

// NOTE do not make method async as truffle will not resolve when utilizing .deployed()
module.exports = deployer => {

  deployer.deploy(ErrorLib, { from: blgAccount, gas: 4e6 })
  .then(() => {
    return deployer.link(ErrorLib, Hub)

  }).then(() => {
    return deployer.deploy(Hub, { from: blgAccount, gas: 4e6 })

  }).then(() => {
    return deployer.deploy(RelayStorage, Hub.address, { from: blgAccount, gas: 4e6 })

  }).then(() => {
    return RelayStorage.deployed()

  }).then(_relayStorage => {
    relayStorage = _relayStorage
    return relayStorage.addReturnDataSize('init(HubInterface.Data_ storage,address)', 0, { from: blgAccount, gas: 4e6 })

  }).then(() => {
    return relayStorage.addReturnDataSize('addResource(HubInterface.Data_ storage,string)', 32, { from: blgAccount, gas: 4e6 })

  }).then(() => {
    return relayStorage.addReturnDataSize('likeResource(HubInterface.Data_ storage,string)', 32, { from: blgAccount, gas: 4e6 })

  }).then(() => {
    return relayStorage.addReturnDataSize(
      'addUser(deployHubdeployHubHubInterface.Data_ storage,address,string,string,string)',
      32,
      { from: blgAccount, gas: 4e6 }
    )

  }).then(() => {
    Relay.unlinked_binary = Relay.unlinked_binary.replace(
      '1111222233334444555566667777888899990000',
      RelayStorage.address.slice(2)
    )

    return deployer.deploy(Relay, { from: blgAccount, gas: 4e6 })

  }).then(() => {
    return deployer.deploy(BLG, { from: blgAccount, gas: 4e6 })

  }).then(() => {
    StaticHub.link('HubInterface', Relay.address)
    return deployer.deploy(StaticHub, BLG.address, { from: blgAccount, gas: 4e6 })

  }).then(() => {
    return BLG.deployed()

  }).then(blg => {
    return blg.setBLGHub(StaticHub.address, { from: blgAccount, gas: 4e6 })
  })
}
