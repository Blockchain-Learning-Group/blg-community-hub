const ErrorLib = artifacts.require('./ErrorLib.sol')
const StaticHub = artifacts.require('./StaticHub.sol')
const Hub = artifacts.require('./Hub.sol')
const Relay = artifacts.require('./Relay.sol')
const RelayStorage = artifacts.require('./RelayStorage.sol')
const BLG = artifacts.require('./BLG.sol')
const blgAccount = web3.eth.accounts[0]

module.exports = async deployer => {
  await deployer.deploy(ErrorLib, { from: blgAccount, gas: 4e6 })

  deployer.link(ErrorLib, Hub)
  await deployer.deploy(Hub, { from: blgAccount, gas: 4e6 })

  const hub = await Hub.deployed()

  await deployer.deploy(RelayStorage, hub.address, { from: blgAccount, gas: 4e6 })
  const relayStorage = await RelayStorage.deployed()

  // Add all exposed methods to the relay storage
  await relayStorage.addReturnDataSize(
    'init(HubInterface.Data_ storage,address)',
    0,
    { from: blgAccount, gas: 4e6 }
  )

  await relayStorage.addReturnDataSize(
    'addResource(HubInterface.Data_ storage,string)',
    32,
    { from: blgAccount, gas: 4e6 }
  )

  await relayStorage.addReturnDataSize(
    'likeResource(HubInterface.Data_ storage,string)',
    32,
    { from: blgAccount, gas: 4e6 }
  )

  await relayStorage.addReturnDataSize(
    'addUser(HubInterface.Data_ storage,address,string,string,string)',
    32,
    { from: blgAccount, gas: 4e6 }
  )

  Relay.unlinked_binary = Relay.unlinked_binary.replace(
    '1111222233334444555566667777888899990000',
    relayStorage.address.slice(2)
  )

  await deployer.deploy(Relay, { from: blgAccount, gas: 4e6 })
  const relay = await Relay.deployed()

  StaticHub.link('HubInterface', relay.address)

  await deployer.deploy(BLG, { from: blgAccount, gas: 4e6 })
  const blg = await BLG.deployed()

  await deployer.deploy(StaticHub, blg.address, { from: blgAccount, gas: 4e6 })
  const staticHub = await StaticHub.deployed()

  await blg.setBLGHub(staticHub.address, { from: blgAccount, gas: 4e6 })
}
