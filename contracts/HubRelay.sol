pragma solidity ^0.4.11;

import './HubRelayStorage.sol';

/// @title Connector for all wallet components
/// @dev Relays all messages from the wallet interface to the latest version
/// of the wallet logic.
/// This contract takes the place of a library and therefore cannot have any
/// storage but MUST be defined as a contract in order to implement a fallback
contract HubRelay {

  event LogReturnLen(uint32 ret);
  event LogTarget(address target);

  /// @dev Fallback to relay all messages to latest lib
  function() external payable {
    HubRelayStorage hubStorage = HubRelayStorage(0x1111222233334444555566667777888899990000);
    uint32 returnlen = hubStorage.returnDataSizes_(msg.sig);

    LogReturnLen(returnlen);

    address target = hubStorage.latestLib_();

    LogTarget(target);

    assembly {
      calldatacopy(0x0, 0x0, calldatasize)
      let a := delegatecall(sub(gas, 10000), target, 0x0, calldatasize, 0, returnlen)
      return(0, returnlen)
    }
  }
}
