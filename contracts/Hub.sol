pragma solidity ^0.4.11;

import './utils/LoggingErrors.sol';
import './token/BLG.sol';
import './utils/SafeMath.sol';

/**
 * @title Static Exposed BLG Hub
 * @dev Interface all users, applications, etc with interface with
 * This interface remains static and will not change where the logic
 * implemented in the Hub libraries may be upgraded.
 */
contract Hub is LoggingErrors {
  uint public constant RESOURCE_REWARD = 1000;
  uint public constant LIKE_REWARD = 10;

  using SafeMath for uint;

  /**
   * Data Structures
   */
  struct User_ {
    string userName_;
    string position_;
    string location_;
    State_ state_;
  }

  struct Resource_ {
    string url_;
    address user_; // user that created this resource
    uint reputation_; // # of likes, shares, etc.
    uint addedAt_; // Block number when this resource was added
    State_ state_;
  }

  enum State_ { doesNotExist, active, inactive, terminated }

  /**
   * Storage
   */
  address blg_; // owner EOA
  address blgToken_; // token contract
  bytes32[] resourceIds_;  // hash of url used to lookup its data
  mapping(bytes32 => Resource_) resources_;
  address[] users_; // used for user lookup and retrieval
  mapping(address => User_) userData_;

  /**
   * Events
   */
   event LogResourceAdded(address user, string resourceUrl, uint blockNumber);
   event LogResourceRemoved(string resourceUrl);
   event LogResourceLiked(string resourceUrl);
   event LogUserAdded(address user);
   event LogUserRemoved(address user);

  /**
   * @dev CONSTRUCTOR - Set the address of the _blgToken
   * @param _blgToken The blg token contract.
   */
  function Hub(address _blgToken) {
    blgToken_ = _blgToken;
    blg_ = msg.sender;
  }

  /**
   * External
   */

  /**
   * @dev Add a new resource to the hub.
   * @param _resourceUrl The url of the resource to be added.
   * @return Success of the transaction.
   */
  function addResource (string _resourceUrl)
    external
    returns (bool)
  {
    // 1 == active as per State_
    if (userData_[msg.sender].state_ != State_.active)
      return error('User is not active, Hub.addResource()');

    if (bytes(_resourceUrl).length == 0)
      return error('Invlaid empty resource, Hub.addResource()');

    // Check if this id already exists.
    bytes32 id = keccak256(_resourceUrl);

    if (resources_[id].state_ != State_.doesNotExist)
      return error('Resource already exists, Hub.addResource()');

    // BLG not entitled to tokens for resource contribution
    if (msg.sender != blg_) {
      // Mint the reward for this user
      /* TODO consider dynamic rewards? */
      bool minted = BLG(blgToken_).mint(msg.sender, RESOURCE_REWARD);

      if (!minted)
        return error('Unable to mint BLG tokens, Hub.addResource()');
    }

    Resource_ memory resource = Resource_({
      url_: _resourceUrl,
      user_: msg.sender,
      reputation_: 0,
      addedAt_: block.number,
      state_: State_.active
    });

    resourceIds_.push(id);
    resources_[id] = resource;

    LogResourceAdded(msg.sender, _resourceUrl, block.number);

    return true;
  }

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
   if (msg.sender != blg_)
     return error('msg.sender != blg, Hub.addUser()');

   if (userData_[_userEOA].state_ != State_.doesNotExist)
     return error('User already exists, Hub.addUser()');

   users_.push(_userEOA);

   userData_[_userEOA] = User_({
     userName_: _userName,
     position_: _position,
     location_: _location,
     state_: State_.active
   });

   LogUserAdded(_userEOA);

   return true;
 }

  /**
   * @dev Like an existing resource to within the hub.
   * @param _resourceUrl The url of the resource to be liked.
   * @return Success of the transaction.
   */
  function likeResource (string _resourceUrl)
    external
    returns (bool)
  {
    // All likes sent from blg owned account
    if (msg.sender != blg_)
      return error('msg.sender != blg, Hub.likeResource()');

    // Get resource info.
    bytes32 id = keccak256(_resourceUrl);
    Resource_ memory resource = resources_[id];

    if (resource.state_ == State_.doesNotExist)
      return error('Resource does not exist, Hub.likeResource()');

    // BLG not entitled to tokens for resource contribution
    if (resource.user_ != blg_) {
      bool minted = BLG(blgToken_).mint(resource.user_, LIKE_REWARD);

      if (!minted)
        return error('Unable to mint BLG tokens, Hub.likeResource()');
    }

    // Update rep and write to storage
    resource.reputation_ = resource.reputation_.add(LIKE_REWARD);
    resources_[id] = resource;

    LogResourceLiked(_resourceUrl);

    return true;
  }

  /**
   * @dev Remove a resource from the hub.
   * @param _resourceUrl The url of the resource to be removed.
   * @return Success of the transaction.
   */
  function removeResource(string _resourceUrl)
    external
  {
    require(msg.sender == blg_);

    /* TODO remove from array as well, get index off chain and use as input param here */
    delete resources_[keccak256(_resourceUrl)];

    LogResourceRemoved(_resourceUrl);
  }

  /**
   * @dev Remove a user from the hub.
   * @param _userEOA The user to be removed.
   * @param _userIndex The index where the user lives within the array.
   * @return Success of the transaction.
   */
  function removeUser(address _userEOA, uint _userIndex)
    external
  {
    require(msg.sender == blg_);

    delete users_[_userIndex];
    delete userData_[_userEOA];

    LogUserRemoved(_userEOA);
  }

  // CONSTANTS
  /**
   * @return The array of users.
   */
  function getAllUsers ()
    external
    constant
    returns(address[])
  {
    return users_;
  }

  /**
   * @param _id The id of the resource to retrieve.
   * @return The resource object data.
   */
  function getResourceById(bytes32 _id)
    external
    constant
    returns(string, address, uint, uint)
  {
    Resource_ memory resource = resources_[_id];

    return (
      resource.url_,
      resource.user_,
      resource.reputation_,
      resource.addedAt_
    );
  }

  /**
   * @return The resource ids.
   */
  function getResourceIds()
    external
    constant
    returns(bytes32[])
  {
    return resourceIds_;
  }

  /**
   * @dev Get the user general data.
   * @param _user The user EOA used as identifier.
   * @return The struct of user data.
   */
  function getUserData(address _user)
    external
    constant
    returns(string, string, string)
  {
    User_ memory user = userData_[_user];

    return (user.userName_, user.position_, user.location_);
  }
}
