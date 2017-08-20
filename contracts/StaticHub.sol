pragma solidity ^0.4.11;

import './HubInterface.sol';

/**
 * @title Static Exposed BLG Hub
 * @dev Interface all users applications, etc with interface with
 * This interface remains static and will not change.
 */
contract StaticHub {
  // "trick" this contract to thinking what lives at this address follows
  // the interface but in fact it will be the fallback invoked every time.
  HubInterface relay_;

  /**
   * @dev Constructor - Set the address of the static relay
   * @param _relay The address of the relay contract.
   */
  function StaticHub(address _relay) {
    relay_ = HubInterface(_relay);
  }

  /**
   * @dev Test function
   */
  function getUint() external returns(uint) {
    return relay_.getUint();
  }
}
