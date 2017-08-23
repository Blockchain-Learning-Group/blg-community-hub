pragma solidity ^0.4.11;

import './HubInterface.sol';
import '../utils/ErrorLib.sol';
import '../token/BLG.sol';

/**
 * @title BLG Community Hub
 * @dev Upgradeable hub library.
 */
library Hub {
  /**
   * Events
   */
  event LogResourceAdded (address user, string resourceUrl);
  event LogUserAdded (address user);

  /**
   * @dev Initialize the hub by setting the address of the blg token and blg EOA.
   * @param  _self The contract storage reference.
   * @param _blgToken The blg token contract.
   * @return Success of the initialization.
   */
  function init (
    HubInterface.Data_ storage _self,
    address _blgToken
  ) external
    returns (bool)
  {
    // No 0s
    if(msg.sender == address(0))
      return ErrorLib.messageString('Invalid blg address, message sent from address(0), Hub.init()');

    if(_blgToken == address(0))
      return ErrorLib.messageString('Invalide blg token address, blgToken == address(0), Hub.init()');

    // may only be set once!!
    if(_self.blg_ != address(0))
      return ErrorLib.messageString('blg EOA address has already been set, Hub.init()');

    if(_self.blgToken_ != address(0))
      return ErrorLib.messageString('blg token address has already been set, Hub.init()');

    _self.blgToken_ = _blgToken;
    _self.blg_ = msg.sender;

    return true;
  }

  /**
   * @dev Add a new resource to the hub.
   * @param  _self The contract storage reference.
   * @param _resourceUrl The url of the new resource.
   * @return Success of the transaction.
   */
  function addResource (
    HubInterface.Data_ storage _self,
    string _resourceUrl
  ) external
    returns (bool)
  {
    // 1 == active as per HubInterface.State
    if (_self.users_[msg.sender] != HubInterface.State.active)
      return ErrorLib.messageString('User is not active, Hub.addResource()');

    if (bytes(_resourceUrl).length == 0)
      return ErrorLib.messageString('Invlaid empty resource, Hub.addResource()');

    // BLG not entitled to tokens for resource contribution
    if (msg.sender != _self.blg_) {
      // Mint the reward for this user
      /* TODO consider dynamic rewards? */
      bool minted = BLG(_self.blgToken_).mint(msg.sender, 1);

      if (!minted)
        return ErrorLib.messageString('Unable to mint BLG tokens, Hub.addResource()');
    }

    _self.resources_.push(_resourceUrl);

    LogResourceAdded(msg.sender, _resourceUrl);

    return true;
  }

  /**
   * @dev Add a new user to the hub. User may write to the hub.
   * @param  _self The contract storage reference.
   * @param _user EOA identifier of the user.
   * @return Success of the transaction.
   */
  function addUser (
    HubInterface.Data_ storage _self,
    address _user
  ) external
    returns (bool)
  {
    if (msg.sender !=_self.blg_)
      return ErrorLib.messageString('msg.sender != blg, Hub.addUser()');

    if (_self.users_[_user] != HubInterface.State.newUser)
      return ErrorLib.messageString('User already exists, Hub.addUser()');

    _self.users_[_user] = HubInterface.State.active;

    LogUserAdded(_user);

    return true;
  }
}
