const BLG = artifacts.require("./BLG.sol")
let callResponse
let txResponse
let blg

contract('BLG.mint()', accounts => {
  const blgAccount = accounts[0]
  const user1 = accounts[1]
  const blgHub = accounts[2]

  it("should mint new tokens and allocate to user.", async () => {
    blg = await BLG.new({ from: blgAccount })
    await blg.setBLGHub(blgHub, { from: blgAccount })
    let value = 1

    callResponse = await blg.mint.call(user1, value, { from: blgHub })
    txResponse = await blg.mint(user1, value, { from: blgHub })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(callResponse, 'Call response was not true.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogTokensMinted', 'LogTokensMinted event was not emitted.')
    assert.equal(eventLog.args.to, user1, 'Incorrect to was emitted.')
    assert.equal(eventLog.args.value, value, 'Incorrect value was emitted.')
    assert.equal(eventLog.args.totalSupply, value, 'Incorrect totalSupply was emitted.')

    // Balance
    const balance = await blg.balanceOf.call(user1)
    assert.equal(balance.toNumber(), value, 'Incorrect user token balance.')

    // Total Supply
    const supply = await blg.totalSupply.call()
    assert.equal(supply.toNumber(), value, 'Incorrect total supply balance.')
  })

  it("should return false and LogErrorString when not from blgHub.", async () => {
    blg = await BLG.new(blgHub, { from: blgAccount })
    await blg.setBLGHub(blgHub, { from: blgAccount })

    let value = 1

    callResponse = await blg.mint.call(user1, value, { from: user1 })
    txResponse = await blg.mint(user1, value, { from: user1 })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('msg.sender != blgHub'), -1, "Incorrect error message: " + errorString);

    // Balance
    const balance = await blg.balanceOf.call(user1)
    assert.equal(balance.toNumber(), 0, 'Incorrect user token balance.')

    // Total Supply
    const supply = await blg.totalSupply.call()
    assert.equal(supply.toNumber(), 0, 'Incorrect total supply balance.')
  })

  it("should return false and LogErrorString when minting a value of 0.", async () => {
    blg = await BLG.new(blgHub, { from: blgAccount })
    await blg.setBLGHub(blgHub, { from: blgAccount })

    let value = 0

    callResponse = await blg.mint.call(user1, value, { from: blgHub })
    txResponse = await blg.mint(user1, value, { from: blgHub })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('Cannot mint a value of <= 0'), -1, "Incorrect error message: " + errorString);

    // Balance
    const balance = await blg.balanceOf.call(user1)
    assert.equal(balance.toNumber(), 0, 'Incorrect user token balance.')

    // Total Supply
    const supply = await blg.totalSupply.call()
    assert.equal(supply.toNumber(), 0, 'Incorrect total supply balance.')
  })

  it("should return false and LogErrorString when minting to address of 0.", async () => {
    blg = await BLG.new(blgHub, { from: blgAccount })
    await blg.setBLGHub(blgHub, { from: blgAccount })

    let value = 1

    callResponse = await blg.mint.call(0, value, { from: blgHub })
    txResponse = await blg.mint(0, value, { from: blgHub })

    // Assert after tx so we can see the emitted logs in the case of failure.
    assert(!callResponse, 'Call response was not false.')

    // Event emission
    const eventLog = txResponse.logs[0]
    assert.equal(eventLog.event, 'LogErrorString', 'LogErrorString event was not emitted.')
    const errorString = eventLog.args.errorString;
    assert.notEqual(errorString.indexOf('Cannot mint tokens to address(0)'), -1, "Incorrect error message: " + errorString);

    // Balance
    const balance = await blg.balanceOf.call(user1)
    assert.equal(balance.toNumber(), 0, 'Incorrect user token balance.')

    // Total Supply
    const supply = await blg.totalSupply.call()
    assert.equal(supply.toNumber(), 0, 'Incorrect total supply balance.')
  })
})
