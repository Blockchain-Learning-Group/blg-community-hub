pragma solidity ^0.4.11;

/**
 * @title BLG Community Hub Interface
 * @dev This is the interface that ALL Hub contracts must follow.
 */
library HubInterface {
  /**
   * Data Structures
   */
  struct Data_ {
    address blg_; // owner EOA
    address blgToken_; // token contract
    string[] resources_; // data URLs
    address[] users_; // used for user lookup and retrieval
    mapping(address => User_) userData_;
  }

  struct User_ {
    string userName_;
    string position_;
    string location_;
    State_ state_;
  }

  enum State_ { newUser, active, inactive, terminated }

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
   * @param  _self The contract storage reference.
   * @param _userEOA User owner EOD, used as their id.
   * @param _userName Screen or real name of user.
   * @param _position Professional position.
   * @param _location Geographic location.
   * @return Success of the transaction.
   */
  function addUser (
    Data_ storage _self,
    address _userEOA,
    string _userName,
    string _position,
    string _location
  ) public
    returns (bool);
}
