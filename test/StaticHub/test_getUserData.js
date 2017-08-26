const etherUtils = require('../../utils/ether')
let callResponse
let txResponse

contract('StaticHub.getUserData()', accounts => {
  const blgAccount = accounts[0]
  const user1 = accounts[1]
  const user2 = accounts[2]
  const name = 'name'
  const position  = 'position'
  const location = 'location'

  it("should return an array of users.", async () => {
    const hubAndBlgContracts = await etherUtils.deployHub(blgAccount)
    const staticHub = hubAndBlgContracts[0]

    await staticHub.addUser(user1, name, position, location, { from: blgAccount })
    await staticHub.addUser(user2, name, position, location, { from: blgAccount })

    const userEOAs = await staticHub.getAllUsers.call()

    let userData = []

    for (let i = 0; i < userEOAs.length; i++) {
      userData.push(await staticHub.getUserData.call(userEOAs[i]))
    }

    // TODO
    // assert.equal(callResponse.length, 2, 'Call response was incorrect length.')
    // assert.equal(callResponse[0], user1, 'user1 incorrect.')
    // assert.equal(callResponse[1], user2, 'user1 incorrect.')
  })
})
