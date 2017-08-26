const StaticHub = artifacts.require("./StaticHub.sol")
const Relay = artifacts.require("./Relay.sol")
const Hub = artifacts.require("./Hub.sol")
const HubV2 = artifacts.require("./HubV2.sol")
const etherUtils = require('../../utils/ether')
let callResponse
let txResponse

contract('StaticHub.addResource()', accounts => {
  const blgAccount = accounts[0]
  const user1 = accounts[1]
  const name= 'adam'
  const position = 'engineer'
  const location = 'london'

  it("should add a new resource and allocte tokens to the sender.", async () => {
    const hubAndBlgContracts = await etherUtils.deployHub(blgAccount)
    const staticHub = hubAndBlgContracts[0]
    const blgToken = hubAndBlgContracts[1]
    let resource = 'https://github.com'

    await staticHub.addUser(user1, name, position, location, { from: blgAccount })

    callResponse = await staticHub.addResource.call(resource, { from: user1 })
    txResponse = await staticHub.addResource(resource, { from: user1 })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(callResponse, 'Call response was not true.')

    // Correct event
    const eventLog = txResponse.logs[0]  // Note 0 is the user being added
    assert.equal(eventLog.event, 'LogResourceAdded', 'LogResourceAdded event was not emitted.')
    assert.equal(eventLog.args.resourceUrl, resource, 'Incorrect url was emitted.')
    assert.equal(eventLog.args.user, user1, 'Incorrect user was emitted.')

    // Check user's token balance increased as well as the total supply
    const balance = await blgToken.balanceOf.call(user1)
    assert.equal(balance.toNumber(), 1, 'User did not receive correct amount of BLG tokens')

    const totalSupply = await blgToken.totalSupply.call(user1)
    assert.equal(totalSupply.toNumber(), 1, 'Total supply of BLG tokens is incorrect')
  })

  it("should add a new resource but NOT allocate tokens when sent form BLG.", async () => {
    const hubAndBlgContracts = await etherUtils.deployHub(blgAccount)
    const staticHub = hubAndBlgContracts[0]
    const blgToken = hubAndBlgContracts[1]

    await staticHub.addUser(blgAccount, name, position, location, { from: blgAccount })

    let resource = 'https://github.com'

    callResponse = await staticHub.addResource.call(resource, { from: blgAccount })
    txResponse = await staticHub.addResource(resource, { from: blgAccount })

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
    const hubAndBlgContracts = await etherUtils.deployHub(blgAccount)
    const staticHub = hubAndBlgContracts[0]
    await staticHub.addUser(user1, name, position, location, { from: blgAccount })

    let resource = ''

    callResponse = await staticHub.addResource.call(resource, { from: user1 })
    txResponse = await staticHub.addResource(resource, { from: user1 })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('Invlaid empty resource'), -1, "Incorrect error message: " + errorString)
  })

  it("should return false and emit LogErrorString when sent from invalid user.", async () => {
    const hubAndBlgContracts = await etherUtils.deployHub(blgAccount)
    const staticHub = hubAndBlgContracts[0]

    // User not added!

    let resource = 'github.com'

    callResponse = await staticHub.addResource.call(resource, { from: user1 })
    txResponse = await staticHub.addResource(resource, { from: user1 })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('User is not active'), -1, "Incorrect error message: " + errorString)
  })

  it("should return false and emit LogErrorString when resource already exists.", async () => {
    const hubAndBlgContracts = await etherUtils.deployHub(blgAccount)
    const staticHub = hubAndBlgContracts[0]
    const blgToken = hubAndBlgContracts[1]
    let resource = 'https://github.com'

    await staticHub.addUser(user1, name, position, location, { from: blgAccount })
    await staticHub.addResource(resource, { from: user1 })

    // add the resource again
    callResponse = await staticHub.addResource.call(resource, { from: user1 })
    txResponse = await staticHub.addResource(resource, { from: user1 })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('Resource already exists'), -1, "Incorrect error message: " + errorString)
  })
})
