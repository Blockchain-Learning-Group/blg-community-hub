const Hub = artifacts.require("./Hub.sol")
const BLG = artifacts.require("./BLG.sol")
let callResponse
let txResponse

contract('StaticHub.addUser()', accounts => {
  const blgAccount = accounts[0]
  const user1 = accounts[1]
  const name= 'adam'
  const position = 'engineer'
  const location = 'london'

  it("should add a new user to the hub and then remove them.", async () => {
    const blgToken = await BLG.new()
    const hub = await Hub.new(blgToken.address)
    blgToken.setBLGHub(hub.address)

    await hub.addUser(user1, name, position, location, { from: blgAccount })
    let users = await hub.getAllUsers()
    assert.equal(users.length, 1, 'No user added')

    await hub.removeUser(users[0], 0, { from: blgAccount })
    users = await hub.getAllUsers()
    assert.equal(users[0], '0x0000000000000000000000000000000000000000', 'User not removed')
  })
})
