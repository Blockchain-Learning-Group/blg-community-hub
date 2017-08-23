const BLG = artifacts.require("./BLG.sol")
let callResponse
let txResponse
let blg

contract('BLG.setBLGHub()', accounts => {
  const blgAccount = accounts[0]
  const user1 = accounts[1]
  const blgHub = accounts[2]

  it("should set the hub address and activate.", async () => {
    blg = await BLG.new({ from: blgAccount })

    callResponse = await blg.setBLGHub.call(blgHub, { from: blgAccount })
    txResponse = await blg.setBLGHub(blgHub, { from: blgAccount })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(callResponse, 'Call response was not true.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogActivated', 'LogTokensMinted event was not emitted.')
    assert.equal(eventLog.args.active, true, 'Incorrect to was emitted.')

    // Confirm active
    const active = await blg.active_.call()
    assert(active, 'BLG is not active')
  })

  it("should return false and LogErrorString when not from blgAccount.", async () => {
    blg = await BLG.new({ from: blgAccount })

    callResponse = await blg.setBLGHub.call(blgHub, { from: user1 })
    txResponse = await blg.setBLGHub(blgHub, { from: user1 })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('msg.sender != blg'), -1, "Incorrect error message: " + errorString);

    // Confirm active
    const active = await blg.active_.call()
    assert(!active, 'BLG is active')
  })

  it("should return false and LogErrorString when trying to set hub as 0.", async () => {
    blg = await BLG.new({ from: blgAccount })

    callResponse = await blg.setBLGHub.call(0, { from: blgAccount })
    txResponse = await blg.setBLGHub(0, { from: blgAccount })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('Invalid hub address, blgHub == address(0)'), -1, "Incorrect error message: " + errorString);

    // Confirm active
    const active = await blg.active_.call()
    assert(!active, 'BLG is active')
  })
})
