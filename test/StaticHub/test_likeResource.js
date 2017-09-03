const StaticHub = artifacts.require("./StaticHub.sol")
const Relay = artifacts.require("./Relay.sol")
const Hub = artifacts.require("./Hub.sol")
const HubV2 = artifacts.require("./HubV2.sol")
const etherUtils = require('../../utils/ether')
const ethABI = require('ethereumjs-abi')
const ethUtil = require('ethereumjs-util')
let callResponse
let txResponse

contract('StaticHub.likeResource()', accounts => {
  const blgAccount = accounts[0]
  const user1 = accounts[1]
  const name= 'adam'
  const position = 'engineer'
  const location = 'london'

  it("should add like a resource and allocte tokens to the owner of the resource if not blg.", async () => {
    const hubAndBlgContracts = await etherUtils.deployHub(blgAccount)
    const staticHub = hubAndBlgContracts[0]
    const blgToken = hubAndBlgContracts[1]
    let resource = 'https://github.com'

    await staticHub.addUser(user1, name, position, location, { from: blgAccount })
    await staticHub.addResource(resource, { from: user1 })

    callResponse = await staticHub.likeResource.call(resource, { from: blgAccount })
    txResponse = await staticHub.likeResource(resource, { from: blgAccount })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(callResponse, 'Call response was not true.')

    // Correct event
    const eventLog = txResponse.logs[0]  // Note 0 is the user being added
    assert.equal(eventLog.event, 'LogResourceLiked', 'LogResourceLiked event was not emitted.')
    assert.equal(eventLog.args.resourceUrl, resource, 'Incorrect url was emitted.')

    // Get resource from contract and confirm values
    const orderParts = [
      { value: resource, type: 'string' }
    ];

    const types = orderParts.map(o => o.type);
    const values = orderParts.map(o => o.value);
    const hashBuff = ethABI.soliditySHA3(types, values);
    const hashHex = ethUtil.bufferToHex(hashBuff);

    // Check user's token balance increased as well as the total supply
    const resourceData = await staticHub.getResourceById.call(hashHex)

    // Reputation now == 1
    assert.equal(resourceData[2], 1, 'Resource rep is incorrect.')

    const balance = await blgToken.balanceOf.call(resourceData[1])
    assert.equal(balance.toNumber(), 2, 'User did not receive correct amount of BLG tokens')

    const totalSupply = await blgToken.totalSupply.call(user1)
    assert.equal(totalSupply.toNumber(), 2, 'Total supply of BLG tokens is incorrect')
  })

  it("should return false and emit LogErrorString when sent from invalid user.", async () => {
    const hubAndBlgContracts = await etherUtils.deployHub(blgAccount)
    const staticHub = hubAndBlgContracts[0]

    // User not added!
    let resource = 'github.com'

    callResponse = await staticHub.likeResource.call(resource, { from: user1 })
    txResponse = await staticHub.likeResource(resource, { from: user1 })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('msg.sender != blg'), -1, "Incorrect error message: " + errorString)
  })

  it("should return false and emit LogErrorString when resource does not exist.", async () => {
    const hubAndBlgContracts = await etherUtils.deployHub(blgAccount)
    const staticHub = hubAndBlgContracts[0]

    // User not added!
    let resource = ''

    callResponse = await staticHub.likeResource.call(resource, { from: blgAccount })
    txResponse = await staticHub.likeResource(resource, { from: blgAccount })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('Resource does not exist'), -1, "Incorrect error message: " + errorString)
  })
})
