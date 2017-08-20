pragma solidity ^0.4.11;

/// @title Hub library Interface
/// @dev Standard logic universally used by wallets
library HubInterface {

  // Storage struct to operate on
  struct HubStorage {
    address owner_;
  }

  /**
  * Core library methods
  */
  /// @dev Initialize the storage struct for a new wallet contract
  /// @param _self The reference to the wallet's storage struct
  /// @param _owner The address of the user's EOA
  function init(HubStorage storage _self, address _owner);

  function test(HubStorage storage _self) returns(uint);
}
