pragma solidity ^0.4.11;

import './HubInterface.sol';
import '../utils/LoggingErrors.sol';

/**
 * @title Static Exposed BLG Hub
 * @dev Interface all users, applications, etc with interface with
 * This interface remains static and will not change where the logic
 * implemented in the Hub libraries may be upgraded.
 */
contract StaticHub is LoggingErrors {

  using HubInterface for HubInterface.Data_;

  /**
   * Storage
   */
  HubInterface.Data_ private hub_;

  /**
   * Events
   */
  event LogResourceAdded (address user, string resourceUrl);
  event LogUserAdded (address user);

  /**
   * @dev CONSTRUCTOR - Set the address of the _blgToken
   * @param _blgToken The blg token contract.
   */
  function StaticHub (address _blgToken) {
    hub_.init(_blgToken);
  }

  /**
   * External
   */

   /**
    * @dev Add a new user that may write to the hub.
    * @param _userEOA User owner EOD, used as their id.
    * @param _userName Screen or real name of user.
    * @param _position Professional position.
    * @param _location Geographic location.
    * @return Success of the transaction.
    */
  function addUser (
    address _userEOA,
    string _userName,
    string _position,
    string _location
  )
    external
    returns (bool)
  {
    return hub_.addUser(_userEOA, _userName, _position, _location);
  }

  /**
   * @dev Add a new resource to the hub.
   * @param _resourceUrl The url of the resource to be added.
   * @return Success of the transaction.
   */
  function addResource (string _resourceUrl)
    external
    returns (bool)
  {
    return hub_.addResource(_resourceUrl);
  }

  /**
   * @return The array of users.
   */
  function getUsers ()
    external
    constant
    returns(address[])
  {
    return hub_.users_;
  }

  /**
   * @dev Get the user general data.
   * @param _user The user EOA used as identifier.
   * @return The struct of user data.
   */
  function getUserData (address _user)
    external
    constant
    returns(string, string, string)
  {
    HubInterface.User_ memory user = hub_.userData_[_user];

    return (user.userName_, user.position_, user.location_);
  }
}
