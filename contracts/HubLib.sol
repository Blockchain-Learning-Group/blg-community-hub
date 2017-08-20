pragma solidity ^0.4.11;

import './HubInterface.sol';

library HubLib {

  function init(
    HubInterface.HubStorage storage _self,
    address _owner
  ) {
    _self.owner_ = _owner;
  }

  function test(
    HubInterface.HubStorage storage _self
  ) returns(uint)
  {
    return 1;
  }
}
