pragma solidity ^0.4.11;

import './HubInterface.sol';

contract Hub {

  using HubInterface for HubInterface.HubStorage;

  /**
   * Storage
   */
  HubInterface.HubStorage private hub_;

  function Hub() {
    /*hub_.init(msg.sender);*/
  }

  function test()
    returns(uint)
  {
    /*return 1;*/
    return hub_.test();
  }
}
