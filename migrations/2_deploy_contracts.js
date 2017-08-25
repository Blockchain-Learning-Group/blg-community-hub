const ErrorLib = artifacts.require('./ErrorLib.sol')
const StaticHub = artifacts.require('./StaticHub.sol')
const Hub = artifacts.require('./Hub.sol')
const Relay = artifacts.require('./Relay.sol')
const RelayStorage = artifacts.require('./RelayStorage.sol')
const BLG = artifacts.require('./BLG.sol')
const blgAccount = web3.eth.accounts[0]

module.exports = async deployer => {
  await deployer.deploy(ErrorLib)

  deployer.link(ErrorLib, Hub)
  await deployer.deploy(Hub)

  const hub = await Hub.deployed()

  await deployer.deploy(RelayStorage, hub.address)
  const relayStorage = await RelayStorage.deployed()

  await relayStorage.addReturnDataSize('init(HubInterface.Data_ storage,address)', 0)
  await relayStorage.addReturnDataSize('addResource(HubInterface.Data_ storage,string)', 32)
  await relayStorage.addReturnDataSize('addUser(HubInterface.Data_ storage,address,string,string,string)', 32)

  Relay.unlinked_binary = Relay.unlinked_binary.replace(
    '1111222233334444555566667777888899990000',
    relayStorage.address.slice(2)
  )

  await deployer.deploy(Relay)
  const relay = await Relay.deployed()

  StaticHub.link('HubInterface', relay.address)

  await deployer.deploy(BLG, { from: blgAccount })
  const blg = await BLG.deployed()

  await deployer.deploy(StaticHub, blg.address, { from: blgAccount })
  const staticHub = await StaticHub.deployed()

  await blg.setBLGHub(staticHub.address)
}
