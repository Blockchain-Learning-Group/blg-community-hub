const StaticHub = artifacts.require('./StaticHub.sol');
const Hub = artifacts.require('./Hub.sol');
const Relay = artifacts.require('./Relay.sol');

module.exports = async deployer => {
  await deployer.deploy(Hub);
  const hub = await Hub.deployed()

  await deployer.deploy(Relay, hub.address)
  const relay = await Relay.deployed()

  // Add all interface methods return data sizes
  await relay.addReturnDataSize('getUint()', 32)

  deployer.deploy(StaticHub, relay.address)
};
