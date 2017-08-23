pragma solidity ^0.4.11;

import './RelayStorage.sol';

/**
 * @title Relay - Enable Upgradeability
 * @dev All calls from the StaticHub are routed here, invoking
 * the fallback as this contract does not implement the methods contained
 * within the upgradeable interface.
 * As this is a library all required storage vars are store in RelatStorage.sol.
 */
contract Relay {
  /**
   * @dev The fallback is invoked and effectively relays the call to the correct contract.
   */
  function() payable {
    RelayStorage relayStorage = RelayStorage(0x1111222233334444555566667777888899990000);
    uint32 returnSize = relayStorage.returnSizes_(msg.sig);
    address currentLib = relayStorage.currentLib_();

    assembly {
      calldatacopy(0x0, 0x0, calldatasize)
      let a := delegatecall(sub(gas, 10000), currentLib, 0x0, calldatasize, 0, returnSize)
      return(0, returnSize)
    }
  }
}
