const Hub = artifacts.require("./Hub.sol")
const BLG = artifacts.require("./BLG.sol")
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
    const blgToken = await BLG.new()
    const hub = await Hub.new(blgToken.address)
    blgToken.setBLGHub(hub.address)

    await hub.addUser(user1, name, position, location, { from: blgAccount })
    await hub.addUser(user2, name, position, location, { from: blgAccount })

    const userEOAs = await hub.getAllUsers.call()

    let userData = []

    for (let i = 0; i < userEOAs.length; i++) {
      userData.push(await hub.getUserData.call(userEOAs[i]))
    }

    // TODO
    // assert.equal(callResponse.length, 2, 'Call response was incorrect length.')
    // assert.equal(callResponse[0], user1, 'user1 incorrect.')
    // assert.equal(callResponse[1], user2, 'user1 incorrect.')
  })
})
