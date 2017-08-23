const StaticHub = artifacts.require("./StaticHub.sol")
const Relay = artifacts.require("./Relay.sol")
const Hub = artifacts.require("./Hub.sol")
const HubV2 = artifacts.require("./HubV2.sol")
let response

contract('Hub Contracts', accounts => {

  /**
   * Non upgradeable pattern
   */
  it.skip("should access the upgrade contract in a non upgradeable pattern!", async () => {
    const hub = await Hub.new()
    const staticHub = await StaticHub.new(hub.address)

    response = await staticHub.getUint.call()
    assert.equal(response.toNumber(), 1, 'hub incorrect')
  })

  /**
   * Upgradeable
   */
  it.skip("should upgrade from v1 to v2", async () => {
    const hub = await Hub.new()
    const relay = await Relay.new(hub.address)
    const staticHub = await StaticHub.new(relay.address)
    await relay.addReturnDataSize('getUint()', 32)

    // First version returns 1
    response = await staticHub.getUint.call()
    assert.equal(response.toNumber(), 1, 'upgrapdeable v1 incorrect')

    // Upgrade to v2
    const upgradeableV2 = await HubV2.new()
    await relay.upgrade(2, upgradeableV2.address)

    // Second version returns 2
    response = await staticHub.getUint.call()
    assert.equal(response.toNumber(), 2, 'upgrapdeable v2 incorrect')
  })

  /**
   * Versioning
   */
  it.skip("should upgrade from v1 to v2 and rollback to v1", async () => {
    const hub = await Hub.new()
    const relay = await Relay.new(hub.address)
    const staticHub = await StaticHub.new(relay.address)
    await relay.addReturnDataSize('getUint()', 32)

    // First version returns 1
    response = await staticHub.getUint.call()
    assert.equal(response.toNumber(), 1, 'Initial v1 incorrect')

    // Upgrade to v2
    const upgradeableV2 = await HubV2.new()
    await relay.upgrade(2, upgradeableV2.address)

    // Second version returns 2
    response = await staticHub.getUint.call()
    assert.equal(response.toNumber(), 2, 'upgrapded v2 incorrect')

    // Rollback to v1
    await relay.rollback(1, upgradeableV2.address)

    // Second version returns 2
    response = await staticHub.getUint.call()
    assert.equal(response.toNumber(), 1, 'rollback v1 incorrect')
  })
})
