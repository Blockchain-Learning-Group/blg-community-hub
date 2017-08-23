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
    * @param _user The user that may write.
    * @return Success of the transaction.
    */
  function addUser (address _user)
    external
    returns (bool)
  {
    return hub_.addUser(_user);
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
}
