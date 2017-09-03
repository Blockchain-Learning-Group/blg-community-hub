const StaticHub = artifacts.require("./StaticHub.sol")
const Relay = artifacts.require("./Relay.sol")
const RelayStorage = artifacts.require("./RelayStorage.sol")
const Hub = artifacts.require("./Hub.sol")
const BLG = artifacts.require("./BLG.sol")
const ErrorLib = artifacts.require("./ErrorLib.sol")

/**
 * Deploy a new hub linked correctly with latest methods.
 * @return  {Contract} The static hub contract object.
 */
async function deployHub (blgAccount) {
  const errorLib = await ErrorLib.new()
  Hub.link('ErrorLib', errorLib.address);
  const hub = await Hub.new();

  const relayStorage = await RelayStorage.new(hub.address)

  // Add required method return sizes
  await relayStorage.addReturnDataSize('init(HubInterface.Data_ storage,address)', 0)
  await relayStorage.addReturnDataSize('addResource(HubInterface.Data_ storage,string)', 32)
  await relayStorage.addReturnDataSize('likeResource(HubInterface.Data_ storage,string)', 32)
  await relayStorage.addReturnDataSize('addUser(deployHubdeployHubHubInterface.Data_ storage,address,string,string,string)', 32)

  Relay.unlinked_binary = Relay.unlinked_binary.replace(
    '1111222233334444555566667777888899990000',
    relayStorage.address.slice(2)
  );

  const relay = await Relay.new()

  StaticHub.link('HubInterface', relay.address);

  const blg = await BLG.new({ from: blgAccount })

  const staticHub = await StaticHub.new(blg.address, { from: blgAccount })

  await blg.setBLGHub(staticHub.address)

  return [staticHub, blg]
}

module.exports = {
  deployHub
}
