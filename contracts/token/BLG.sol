pragma solidity ^0.4.11;

import './ERC20.sol';
import '../utils/SafeMath.sol';
import '../utils/LoggingErrors.sol';

/**
 * @title BLG Token
 * @dev A reward token for participants in the BLG community.  Rewarded for
 * contributions to the community hub.
 */
contract BLG is ERC20, LoggingErrors {

  using SafeMath for uint256;

  /**
   * Storage
   *
   */
  uint public constant DECIMALS = 18;
  string public constant NAME = 'BLG';
  uint256 public totalSupply_;
  mapping (address => uint256) public balances_;

  address public blg_; // EOA
  address public blgHub_; // hub contract
  bool public active_; // active after the blg hub has been set

  /**
   * Events
   */
  event Transfer (address indexed _from, address indexed _to, uint256 _value);
  event LogTokensMinted (address indexed _to, address to, uint256 value, uint256 totalSupply);
  event LogActivated(bool active);

  /**
   * @dev CONSTRUCTOR - set blg owner account
   */
  function BLG () {
    blg_ = msg.sender;
    active_ = false;
  }

  /**
   * External
   */

  /**
   * @dev Mint tokens and allocate them to the specified user.
   * @param _to The address of the recipient.
   * @param _value The amount of tokens to be minted and transferred.
   * @return Success of the transaction.
   */
  function mint (address _to, uint _value)
    external
    returns (bool)
  {
    if (!active_)
      return error('BLG is not yet active, BLG.mint()');

    if (msg.sender != blgHub_)
      return error('msg.sender != blgHub, BLG.mint()');

    if (_value <= 0)
      return error('Cannot mint a value of <= 0, BLG.mint()');

    if (_to == address(0))
      return error('Cannot mint tokens to address(0), BLG.mint()');

    totalSupply_ = totalSupply_.add(_value);
    balances_[_to] = balances_[_to].add(_value);

    LogTokensMinted(_to, _to, _value, totalSupply_);

    return true;
  }

  /**
   * @dev Set the address of the blg hub contract and activate token.
   * @param _blgHub The blg hub contract.
   * @return Success of the transaction.
   */
  function setBLGHub (
    address _blgHub
  ) external
    returns (bool)
  {
    if (msg.sender != blg_)
      return error('msg.sender != blg, BLG.setBLGHub()');

    if (_blgHub == address(0))
      return error('Invalid hub address, blgHub == address(0), BLG.setBLGHub()');

    blgHub_ = _blgHub;
    active_ = true;

    LogActivated(true);

    return true;
  }

  /**
   * @dev send `_value` token to `_to` from `msg.sender`
   * @param _to The address of the recipient, sent from msg.sender.
   * @param _value The amount of token to be transferred
   * @return Whether the transfer was successful or not
   */
  function transfer (
    address _to,
    uint256 _value
  ) external
    returns (bool)
  {
    if (!active_)
      return error('BLG is not yet active, BLG.setBLGHub()');

    balances_[msg.sender] = balances_[msg.sender].sub(_value);
    balances_[_to] = balances_[_to].add(_value);

    Transfer(msg.sender, _to, _value);

    return true;
  }

  // Constants

  /**
   * @return total amount of tokens.
   */
  function totalSupply ()
    external
    constant
    returns (uint256)
  {
    return totalSupply_;
  }

  /**
   * @param _owner The address from which the balance will be retrieved.
   * @return The balance
   */
  function balanceOf (
    address _owner
  ) external
    constant
    returns (uint256)
  {
    return balances_[_owner];
  }
}
