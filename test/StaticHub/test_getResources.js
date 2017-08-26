const etherUtils = require('../../utils/ether')
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
    const hubAndBlgContracts = await etherUtils.deployHub(blgAccount)
    const staticHub = hubAndBlgContracts[0]
    let resources = []

    await staticHub.addUser(user1, name, position, location, { from: blgAccount })
    await staticHub.addUser(user2, name, position, location, { from: blgAccount })
    await staticHub.addResource(resource1, { from: user1 })
    await staticHub.addResource(resource2, { from: user2 })

    let resourceIds = await staticHub.getResourceIds.call()

    for (let i = 0; i < resourceIds.length; i++) {
      resources.push(await staticHub.getResourceById.call(resourceIds[i]))
    }

    assert.equal(resourceIds.length, 2, 'Call response was incorrect length.')
    assert.equal(resources[0][0], resource1, 'resource1 incorrect.')
    assert.equal(resources[0][1], user1, 'user1 incorrect.')
    assert.equal(resources[1][0], resource2, 'resource1 incorrect.')
    assert.equal(resources[1][1], user2, 'user2 incorrect.')
  })
})
