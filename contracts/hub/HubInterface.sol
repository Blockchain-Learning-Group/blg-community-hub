pragma solidity ^0.4.11;

/**
 * @title BLG Community Hub Interface
 * @dev This is the interface that ALL Hub contracts must follow.
 */
library HubInterface {

  enum State { newUser, active, inactive, terminated }

  struct Data_ {
    address blg_; // owner EOA
    address blgToken_; // token contract
    string[] resources_; // data URLs
    mapping(address => State) users_;
  }

  /**
   * @dev Initialize the hub.
   * @param _self The contract storage reference.
   * @param _blgToken The blg token contract.
   */
  function init (
    Data_ storage _self,
    address _blgToken
  ) public;

  /**
   * @dev Add a new resource to the hub.
   * @param  _self The contract storage reference.
   * @param _resourceUrl The url of the new resource.
   * @return Success of the transaction.
   */
  function addResource (
    Data_ storage _self,
    string _resourceUrl
  ) public
    returns(bool);

  /**
  * @dev Add a new user that may write to the hub.
  * @param _user The user EOA.
  * @return Success of the transaction.
  */
  function addUser (
    Data_ storage _self,
    address _user
  ) public
    returns (bool);
}
