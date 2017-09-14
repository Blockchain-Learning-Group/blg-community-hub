const Hub = artifacts.require("./Hub.sol")
const BLG = artifacts.require("./BLG.sol")
let callResponse
let txResponse

contract('StaticHub.getResources()', accounts => {
  const blgAccount = accounts[0]
  const user1 = accounts[1]
  const user2 = accounts[2]
  const name = 'name'
  const position = 'position'
  const location = 'location'
  const resource1 = 'resource1'
  const resource2 = 'resource2'

  it("should return an array of resources.", async () => {
    const blgToken = await BLG.new()
    const hub = await Hub.new(blgToken.address)
    blgToken.setBLGHub(hub.address)
    let resources = []

    await hub.addUser(user1, name, position, location, { from: blgAccount })
    await hub.addUser(user2, name, position, location, { from: blgAccount })
    await hub.addResource(resource1, { from: user1 })
    await hub.addResource(resource2, { from: user2 })

    let resourceIds = await hub.getResourceIds.call()

    for (let i = 0; i < resourceIds.length; i++) {
      resources.push(await hub.getResourceById.call(resourceIds[i]))
    }

    assert.equal(resourceIds.length, 2, 'Call response was incorrect length.')
    assert.equal(resources[0][0], resource1, 'resource1 incorrect.')
    assert.equal(resources[0][1], user1, 'user1 incorrect.')
    assert.equal(resources[1][0], resource2, 'resource1 incorrect.')
    assert.equal(resources[1][1], user2, 'user2 incorrect.')
  })
})
