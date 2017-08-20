const Hub = artifacts.require('./Hub.sol')
const HubInterface = artifacts.require('./HubInterface.sol')
const HubRelay = artifacts.require('./HubRelay.sol')
const HubRelayStorage = artifacts.require('./HubRelayStorage.sol')
const HubLib = artifacts.require('./Hub.sol')

contract('Test Upgrade Hub', accounts => {
  const owner = accounts[0]

  it('works', () => {
    let response

    HubRelayStorage.deployed().then(hubRelayStorage => {

      // hubRelayStorage.addReturnDataSize('test(HubStorage storage _self)', 32).then(() => {

        Hub.deployed().then(hub => {
          hub.test.call().then(res => {
            console.log('res')
            console.log('res')
            console.log(res)
          })
        })

      // })

    })




    // const balance = await wallet.balanceOf.call(0);
    // console.log(balance.toNumber());
    // console.log(web3.eth.getBalance(wallet.address).toNumber());

    // Deploy new lib
    // WalletLogic_02.link('ErrorLib', errorLib.address);
    // const walletLogic_02 = await WalletLogic_02.new();
    // connectorStorage.updateLibrary(walletLogic_02.address);
    //
    // const response2 = await wallet.get();
    // console.log(response2);
  });
});
