const Hub = artifacts.require('./Hub.sol')
const HubInterface = artifacts.require('./HubInterface.sol')
const HubRelay = artifacts.require('./HubRelay.sol')
const HubRelayStorage = artifacts.require('./HubRelayStorage.sol')
const HubLib = artifacts.require('./Hub.sol')

module.exports = deployer => {
  // Hub upgradeable library
  

  // deployer.deploy(HubLib).then(() => {
  //   HubLib.deployed().then(hubLib => {
  //     deployer.deploy(HubRelayStorage, hubLib.address).then(() => {
  //       HubRelayStorage.deployed().then(hubRelayStorage => {
  //
  //         HubRelay.unlinked_binary = HubRelay.unlinked_binary.replace(
  //           '1111222233334444555566667777888899990000',
  //           hubRelayStorage.address.slice(2)
  //         )
  //
  //         deployer.deploy(HubRelay).then(() => {
  //           HubRelay.deployed().then(hubRelay => {
  //
  //             Hub.link('HubInterface', hubRelay.address)
  //
  //             console.log('Hub Linked!')
  //
  //             deployer.deploy(Hub).then(() => {
  //               console.log('hub deployed')
  //             })
  //           })
  //         })
  //       })
  //     })
  //   })

};
