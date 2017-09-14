const Hub = artifacts.require("./Hub.sol")
const BLG = artifacts.require("./BLG.sol")
let callResponse
let txResponse

contract('Hub.addResource()', accounts => {
  const blgAccount = accounts[0]
  const user1 = accounts[1]
  const name= 'adam'
  const position = 'engineer'
  const location = 'london'

  it("should add a new resource and allocte tokens to the sender.", async () => {
    const blgToken = await BLG.new()
    const hub = await Hub.new(blgToken.address)
    blgToken.setBLGHub(hub.address)

    let resource = 'https://github.com'

    await hub.addUser(user1, name, position, location, { from: blgAccount })

    callResponse = await hub.addResource.call(resource, { from: user1 })
    txResponse = await hub.addResource(resource, { from: user1 })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(callResponse, 'Call response was not true.')

    // Correct event
    const eventLog = txResponse.logs[0]  // Note 0 is the user being added
    assert.equal(eventLog.event, 'LogResourceAdded', 'LogResourceAdded event was not emitted.')
    assert.equal(eventLog.args.resourceUrl, resource, 'Incorrect url was emitted.')
    assert.equal(eventLog.args.user, user1, 'Incorrect user was emitted.')

    // Check user's token balance increased as well as the total supply
    const balance = await blgToken.balanceOf.call(user1)
    assert.equal(balance.toNumber(), 1000, 'User did not receive correct amount of BLG tokens')

    const totalSupply = await blgToken.totalSupply.call(user1)
    assert.equal(totalSupply.toNumber(), 1000, 'Total supply of BLG tokens is incorrect')
  })

  it("should add a new resource but NOT allocate tokens when sent form BLG.", async () => {
    const blgToken = await BLG.new()
    const hub = await Hub.new(blgToken.address)
    blgToken.setBLGHub(hub.address)

    await hub.addUser(blgAccount, name, position, location, { from: blgAccount })

    let resource = 'https://github.com'

    callResponse = await hub.addResource.call(resource, { from: blgAccount })
    txResponse = await hub.addResource(resource, { from: blgAccount })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(callResponse, 'Call response was not true.')

    // Correct event
    const eventLog = txResponse.logs[0]  // Note 0 is the user being added
    assert.equal(eventLog.event, 'LogResourceAdded', 'LogResourceAdded event was not emitted.')
    assert.equal(eventLog.args.resourceUrl, resource, 'Incorrect url was emitted.')
    assert.equal(eventLog.args.user, blgAccount, 'Incorrect user was emitted.')

    // Check user's token balance increased as well as the total supply
    const balance = await blgToken.balanceOf.call(user1)
    assert.equal(balance.toNumber(), 0, 'User did not receive correct amount of BLG tokens')

    const totalSupply = await blgToken.totalSupply.call(user1)
    assert.equal(totalSupply.toNumber(), 0, 'Total supply of BLG tokens is incorrect')
  })

  it("should return false and emit LogErrorString when empty resource submitted.", async () => {
    const blgToken = await BLG.new()
    const hub = await Hub.new(blgToken.address)
    blgToken.setBLGHub(hub.address)
    await hub.addUser(user1, name, position, location, { from: blgAccount })

    let resource = ''

    callResponse = await hub.addResource.call(resource, { from: user1 })
    txResponse = await hub.addResource(resource, { from: user1 })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('Invlaid empty resource'), -1, "Incorrect error message: " + errorString)
  })

  it("should return false and emit LogErrorString when sent from invalid user.", async () => {
    const blgToken = await BLG.new()
    const hub = await Hub.new(blgToken.address)
    blgToken.setBLGHub(hub.address)

    // User not added!

    let resource = 'github.com'

    callResponse = await hub.addResource.call(resource, { from: user1 })
    txResponse = await hub.addResource(resource, { from: user1 })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('User is not active'), -1, "Incorrect error message: " + errorString)
  })

  it("should return false and emit LogErrorString when resource already exists.", async () => {
    const blgToken = await BLG.new()
    const hub = await Hub.new(blgToken.address)
    blgToken.setBLGHub(hub.address)
    let resource = 'https://github.com'

    await hub.addUser(user1, name, position, location, { from: blgAccount })
    await hub.addResource(resource, { from: user1 })

    // add the resource again
    callResponse = await hub.addResource.call(resource, { from: user1 })
    txResponse = await hub.addResource(resource, { from: user1 })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('Resource already exists'), -1, "Incorrect error message: " + errorString)
  })
})
